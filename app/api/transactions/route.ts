/**
 * API ROUTE: /api/transactions
 *
 * Gestionează tranzacțiile utilizatorului curent.
 * GET    - Listează tranzacții cu filtre (date, bancă, categorie, căutare)
 * POST   - Adaugă o tranzacție nouă
 * DELETE - Șterge o tranzacție
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

// ─── GET /api/transactions ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom   = searchParams.get("date_from");
    const dateTo     = searchParams.get("date_to");
    const bankId     = searchParams.get("bank_id");
    const categoryId = searchParams.get("category_id");
    const search     = searchParams.get("search");

    let query = db
      .from("transactions")
      .select(`
        *,
        banks ( id, name, color ),
        categories ( id, name, icon, type )
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (dateFrom)   query = query.gte("date", dateFrom);
    if (dateTo)     query = query.lte("date", dateTo);
    if (bankId)     query = query.eq("bank_id", bankId);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) {
      // Normalizăm searchul — eliminăm diacriticele pentru căutare mai flexibilă
      const normalized = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      query = query.or(`description.ilike.%${search}%,description.ilike.%${normalized}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[TRANSACTIONS GET] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la încărcarea tranzacțiilor" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[TRANSACTIONS GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── POST /api/transactions ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { date, description, amount, currency, bank_id, category_id } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Data tranzacției este obligatorie" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 1) {
      return NextResponse.json({ error: "Descrierea este obligatorie" }, { status: 400 });
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Suma este obligatorie" }, { status: 400 });
    }

    const { data, error } = await db
      .from("transactions")
      .insert({
        id: createId(),
        user_id: userId,
        date,
        description: description.trim(),
        amount: Number(amount),
        currency: currency || "RON",
        bank_id: bank_id || null,
        category_id: category_id || null,
      })
      .select(`
        *,
        banks ( id, name, color ),
        categories ( id, name, icon, type )
      `)
      .single();

    if (error) {
      console.error("[TRANSACTIONS POST] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la adăugarea tranzacției" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── PUT /api/transactions ────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, description, amount, currency, bank_id, category_id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID tranzacție lipsă" }, { status: 400 });
    }
    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "Data tranzacției este obligatorie" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 1) {
      return NextResponse.json({ error: "Descrierea este obligatorie" }, { status: 400 });
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Suma este obligatorie" }, { status: 400 });
    }

    const { data, error } = await db
      .from("transactions")
      .update({
        date,
        description: description.trim(),
        amount: Number(amount),
        currency: currency || "RON",
        bank_id: bank_id || null,
        category_id: category_id || null,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select(`*, banks ( id, name, color ), categories ( id, name, icon, type )`)
      .single();

    if (error) {
      console.error("[TRANSACTIONS PUT] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la editarea tranzacției" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[TRANSACTIONS PUT] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── DELETE /api/transactions ─────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID tranzacție lipsă" }, { status: 400 });
    }

    const { error } = await db
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[TRANSACTIONS DELETE] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la ștergerea tranzacției" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRANSACTIONS DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
