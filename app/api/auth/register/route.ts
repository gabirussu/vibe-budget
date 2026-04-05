/**
 * API ROUTE: POST /api/auth/register
 *
 * Creează un cont nou:
 * 1. Supabase Auth (auth.users) - gestionează parola și sesiunea
 * 2. public.users (Drizzle) - stochează numele și moneda nativă
 * 3. Seed categorii de sistem pentru utilizatorul nou
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";

// ─── Categorii predefinite ────────────────────────────────────────────────────

const SYSTEM_CATEGORIES = [
  // Cheltuieli
  { name: "Transport",        type: "expense", icon: "🚗",  color: "#3b82f6", description: "Transport în comun, benzină, service auto, taxi, Uber" },
  { name: "Cumpărături",      type: "expense", icon: "🛍️",  color: "#22c55e", description: "Supermarket, cumpărături online, haine, electronice" },
  { name: "Locuință",         type: "expense", icon: "🏠",  color: "#f97316", description: "Utilități, chirie, rate imobiliare, renovări" },
  { name: "Sănătate",         type: "expense", icon: "🏥",  color: "#ef4444", description: "Medicamente, consultații, investigații medicale" },
  { name: "Divertisment",     type: "expense", icon: "🍽️",  color: "#ec4899", description: "Restaurante, cafenele, cinema, ieșiri în oraș" },
  { name: "Subscripții",      type: "expense", icon: "📺",  color: "#8b5cf6", description: "Abonamente streaming, software, servicii cloud, fitness" },
  { name: "Educație",         type: "expense", icon: "📚",  color: "#6366f1", description: "Cărți, cursuri online, training-uri, școală" },
  { name: "Taxe și Impozite", type: "expense", icon: "🧾",  color: "#6b7280", description: "Taxe, impozite, amenzi, penalități" },
  { name: "Cash",             type: "expense", icon: "💵",  color: "#f59e0b", description: "Retrageri de numerar de la ATM" },
  { name: "Transfer Intern",  type: "expense", icon: "🔄",  color: "#06b6d4", description: "Transferuri între propriile conturi" },
  // Venituri
  { name: "Venituri",         type: "income",  icon: "💰",  color: "#10b981", description: "Salarii, freelance, dividende, bonusuri" },
  { name: "Transferuri",      type: "income",  icon: "💸",  color: "#14b8a6", description: "Transferuri primite de la prieteni sau familie" },
] as const;

export async function POST(request: NextRequest) {
  try {
    // 1. Extragem datele din body
    const { name, email, password } = await request.json();

    // 2. Validare
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Numele, emailul și parola sunt obligatorii" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Parola trebuie să aibă minim 6 caractere" },
        { status: 400 }
      );
    }

    // 3. Creăm contul în Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "Există deja un cont cu acest email" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Există deja un cont cu acest email" },
        { status: 400 }
      );
    }

    // 4. Inserăm în public.users via admin client (bypass RLS)
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { error: dbError } = await adminDb
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name,
        native_currency: "RON",
        trial_ends_at: trialEndsAt,
      });

    if (dbError) {
      console.error("[REGISTER] DB insert error:", dbError);
      // Ștergem userul din Auth dacă inserarea în DB a eșuat
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
      return NextResponse.json(
        { error: "Eroare la crearea profilului" },
        { status: 500 }
      );
    }

    // 5. Seed categorii de sistem pentru utilizatorul nou
    try {
      const categoriesToInsert = SYSTEM_CATEGORIES.map((cat) => ({
        id: createId(),
        user_id: authData.user!.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        is_system_category: true,
      }));

      const { error: seedError } = await adminDb
        .from("categories")
        .insert(categoriesToInsert);

      if (seedError) {
        console.error("[REGISTER] Seed categories error:", seedError);
        // Nu blocăm înregistrarea — categoriile pot fi adăugate manual
      }
    } catch (seedErr) {
      console.error("[REGISTER] Seed categories exception:", seedErr);
    }

    return NextResponse.json(
      { message: "Cont creat cu succes" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Eroare internă server" },
      { status: 500 }
    );
  }
}
