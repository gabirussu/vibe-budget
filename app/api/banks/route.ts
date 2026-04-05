/**
 * API ROUTE: /api/banks
 *
 * Gestionează băncile utilizatorului curent.
 * GET    - Listează toate băncile
 * POST   - Adaugă o bancă nouă
 * PUT    - Editează o bancă existentă
 * DELETE - Șterge o bancă
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";

// Client cu Service Role Key — ocolește RLS, folosit după ce verificăm sesiunea
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

// ─── GET /api/banks ───────────────────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { data, error } = await db
      .from("banks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[BANKS GET] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la încărcarea băncilor" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[BANKS GET] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── POST /api/banks ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Numele băncii trebuie să aibă cel puțin 2 caractere" },
        { status: 400 }
      );
    }

    const colorValue = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6366f1";

    const { data, error } = await db
      .from("banks")
      .insert({ id: createId(), user_id: userId, name: name.trim(), color: colorValue })
      .select()
      .single();

    if (error) {
      console.error("[BANKS POST] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la adăugarea băncii" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[BANKS POST] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── PUT /api/banks ───────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, color } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID bancă lipsă" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Numele băncii trebuie să aibă cel puțin 2 caractere" },
        { status: 400 }
      );
    }

    const colorValue = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6366f1";

    const { data, error } = await db
      .from("banks")
      .update({ name: name.trim(), color: colorValue, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[BANKS PUT] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la editarea băncii" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Banca nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[BANKS PUT] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

// ─── DELETE /api/banks ────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { db, userId } = await getAuthUser();
    if (!db || !userId) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID bancă lipsă" }, { status: 400 });
    }

    const { error } = await db
      .from("banks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[BANKS DELETE] Supabase error:", error);
      return NextResponse.json({ error: "Eroare la ștergerea băncii" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BANKS DELETE] Error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
