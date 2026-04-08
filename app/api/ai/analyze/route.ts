/**
 * API ROUTE: /api/ai/analyze
 *
 * Analizează datele financiare agregate ale utilizatorului folosind Claude AI.
 * POST - Primește rezumat agregat (NU tranzacții individuale) și returnează
 *        analiză cu health score, sfaturi personalizate și observație pozitivă.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { analyzeFinances, type FinancialData } from "@/lib/ai/financial-coach";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { db: null, userId: null };
  return { db: getAdminClient(), userId: user.id };
}

// ─── POST /api/ai/analyze ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Autentificare
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    // 2. Verificare cheie API
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[AI ANALYZE] ANTHROPIC_API_KEY lipsește din environment");
      return NextResponse.json(
        { error: "Serviciul AI nu este configurat. Adaugă ANTHROPIC_API_KEY în variabilele de mediu." },
        { status: 503 }
      );
    }

    // 3. Parsare și validare body
    const body = await request.json() as unknown;

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Payload invalid" }, { status: 400 });
    }

    const data = body as Record<string, unknown>;

    if (!data.summary || !data.period) {
      return NextResponse.json(
        { error: "Câmpurile 'summary' și 'period' sunt obligatorii" },
        { status: 400 }
      );
    }

    // 4. Apel Claude AI
    const financialData = data as unknown as FinancialData;
    const analysis = await analyzeFinances(financialData);

    // 5. Răspuns
    return NextResponse.json({ data: analysis });

  } catch (error) {
    console.error("[AI ANALYZE] Error:", error);

    if (error instanceof Error && error.message.toLowerCase().includes("rate")) {
      return NextResponse.json(
        { error: "Prea multe cereri. Încearcă din nou în câteva momente." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Eroare la analiza AI" }, { status: 500 });
  }
}
