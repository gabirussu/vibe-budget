/**
 * API ROUTE: /api/currencies
 *
 * Gestionează valutele utilizatorului curent.
 * GET    - Listează toate valutele
 * POST   - Adaugă o valută nouă
 * DELETE - Șterge o valută
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";

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

// ─── GET /api/currencies ──────────────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { data, error } = await db
      .from("currencies")
      .select("*")
      .eq("user_id", userId)
      .order("code", { ascending: true });

    if (error) {
      console.error("[CURRENCIES GET] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la încărcarea valutelor" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CURRENCIES GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── POST /api/currencies ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { code, symbol, name } = body;

    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return NextResponse.json({ error: "Codul valutei trebuie să aibă cel puțin 2 caractere" }, { status: 400 });
    }
    if (!symbol || typeof symbol !== "string" || symbol.trim().length < 1) {
      return NextResponse.json({ error: "Simbolul valutei este obligatoriu" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Numele valutei trebuie să aibă cel puțin 2 caractere" }, { status: 400 });
    }

    // Verificăm dacă valuta există deja
    const { data: existing } = await db
      .from("currencies")
      .select("id")
      .eq("user_id", userId)
      .eq("code", code.trim().toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Valuta există deja" }, { status: 409 });
    }

    const { data, error } = await db
      .from("currencies")
      .insert({
        id: createId(),
        user_id: userId,
        code: code.trim().toUpperCase(),
        symbol: symbol.trim(),
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CURRENCIES POST] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la adăugarea valutei" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[CURRENCIES POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── DELETE /api/currencies ───────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID valută lipsă" }, { status: 400 });
    }

    const { error } = await db
      .from("currencies")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[CURRENCIES DELETE] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la ștergerea valutei" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CURRENCIES DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
