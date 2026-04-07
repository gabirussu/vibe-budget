/**
 * API ROUTE: /api/import
 *
 * Import bulk de tranzacții cu auto-categorizare.
 * POST - Importă un array de tranzacții și aplică auto-categorizare din user_keywords
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";
import { autoCategorize } from "@/lib/auto-categorization";

const MAX_IMPORT_SIZE = 1000;

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

// ─── Interfețe ────────────────────────────────────────────────────────────────

interface ImportTransaction {
  bankId: string | null;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: "income" | "expense";
}

interface UserKeyword {
  keyword: string;
  category_id: string;
}

// ─── POST /api/import ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Autentificare
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    // 2. Parsare body
    const body = await request.json();
    const { transactions } = body;

    // 3. Validare array
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "Lista de tranzacții este obligatorie și nu poate fi goală" },
        { status: 400 }
      );
    }

    if (transactions.length > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `Poți importa maximum ${MAX_IMPORT_SIZE} tranzacții odată` },
        { status: 400 }
      );
    }

    // 4. Validare structură fiecare tranzacție
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i] as ImportTransaction;
      if (!t.date || typeof t.date !== "string") {
        return NextResponse.json(
          { error: `Tranzacția ${i + 1}: data este obligatorie` },
          { status: 400 }
        );
      }
      if (!t.description || typeof t.description !== "string" || t.description.trim().length < 1) {
        return NextResponse.json(
          { error: `Tranzacția ${i + 1}: descrierea este obligatorie` },
          { status: 400 }
        );
      }
      if (t.amount === undefined || t.amount === null || isNaN(Number(t.amount))) {
        return NextResponse.json(
          { error: `Tranzacția ${i + 1}: suma este obligatorie` },
          { status: 400 }
        );
      }
      if (t.type !== "income" && t.type !== "expense") {
        return NextResponse.json(
          { error: `Tranzacția ${i + 1}: tipul trebuie să fie 'income' sau 'expense'` },
          { status: 400 }
        );
      }
    }

    // 5. Fetch user_keywords pentru auto-categorizare
    const { data: userKeywords, error: keywordsError } = await db
      .from("user_keywords")
      .select("keyword, category_id")
      .eq("user_id", userId);

    if (keywordsError) {
      console.error("[IMPORT POST] Keywords fetch error:", keywordsError);
      return NextResponse.json(
        { error: "Eroare la încărcarea keyword-urilor" },
        { status: 500 }
      );
    }

    const keywords: UserKeyword[] = userKeywords ?? [];

    // 6. Construire array pentru bulk insert + auto-categorizare
    let categorizedCount = 0;

    const rows = transactions.map((t: ImportTransaction) => {
      // Determinăm semnul sumei în funcție de tip
      // Math.abs ca gardă — CSV-urile pot trimite deja valori negative
      const finalAmount =
        t.type === "expense"
          ? -Math.abs(Number(t.amount))
          : Math.abs(Number(t.amount));

      // Auto-categorizare pe baza keyword-urilor utilizatorului
      const categoryId = autoCategorize(t.description, keywords);
      if (categoryId) categorizedCount++;

      return {
        id: createId(),
        user_id: userId,
        bank_id: t.bankId ?? null,
        category_id: categoryId,
        date: t.date,
        description: t.description.trim(),
        amount: finalAmount,
        currency: t.currency || "RON",
      };
    });

    // 7. Bulk insert — un singur round-trip la DB
    const { error: insertError } = await db
      .from("transactions")
      .insert(rows);

    if (insertError) {
      console.error("[IMPORT POST] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Eroare la importul tranzacțiilor" },
        { status: 500 }
      );
    }

    // 8. Răspuns cu statistici
    return NextResponse.json(
      {
        success: true,
        imported: rows.length,
        categorized: categorizedCount,
        message: `${rows.length} tranzacții importate, ${categorizedCount} categorizate automat`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[IMPORT POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
