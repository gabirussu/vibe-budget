/**
 * API ROUTE: POST /api/auth/register
 *
 * Creează un cont nou:
 * 1. Supabase Auth (auth.users) - gestionează parola și sesiunea
 * 2. public.users (Drizzle) - stochează numele și moneda nativă
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // 4. Inserăm în public.users via Supabase client (ocolim Transaction Pooler)
    const { error: dbError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        name,
        native_currency: "RON",
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
