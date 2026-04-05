/**
 * API ROUTE: /api/categories
 *
 * Gestionează categoriile utilizatorului curent.
 * GET    - Listează toate categoriile (sistem + personalizate)
 * POST   - Adaugă o categorie personalizată nouă
 * PUT    - Editează o categorie personalizată
 * DELETE - Șterge o categorie personalizată (nu și cele de sistem)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";

// Client cu Service Role Key — ocolește RLS
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Helper: verifică sesiunea și returnează userId + admin client
async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { db: null, userId: null };
  return { db: getAdminClient(), userId: user.id };
}

// ─── GET /api/categories ──────────────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { data, error } = await db
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("is_system_category", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("[CATEGORIES GET] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la încărcarea categoriilor" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CATEGORIES GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── POST /api/categories ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, icon } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Numele categoriei trebuie să aibă cel puțin 2 caractere" },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Tipul categoriei trebuie să fie 'income' sau 'expense'" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("categories")
      .insert({
        id: createId(),
        user_id: userId,
        name: name.trim(),
        type,
        icon: icon || "📁",
        is_system_category: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[CATEGORIES POST] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la adăugarea categoriei" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[CATEGORIES POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── PUT /api/categories ──────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, icon } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID categorie lipsă" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Numele categoriei trebuie să aibă cel puțin 2 caractere" },
        { status: 400 }
      );
    }

    // Verificăm că nu e categorie de sistem
    const { data: existing } = await db
      .from("categories")
      .select("is_system_category")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (existing?.is_system_category) {
      return NextResponse.json(
        { error: "Categoriile de sistem nu pot fi modificate" },
        { status: 403 }
      );
    }

    const { data, error } = await db
      .from("categories")
      .update({ name: name.trim(), icon: icon || "📁", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[CATEGORIES PUT] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la editarea categoriei" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CATEGORIES PUT] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── DELETE /api/categories ───────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID categorie lipsă" }, { status: 400 });
    }

    // Verificăm că nu e categorie de sistem
    const { data: existing } = await db
      .from("categories")
      .select("is_system_category")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (existing?.is_system_category) {
      return NextResponse.json(
        { error: "Categoriile de sistem nu pot fi șterse" },
        { status: 403 }
      );
    }

    const { error } = await db
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_system_category", false);

    if (error) {
      console.error("[CATEGORIES DELETE] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la ștergerea categoriei" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CATEGORIES DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
