"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Nu am putut trimite emailul. Verifică adresa și încearcă din nou.");
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 w-full max-w-md text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifică emailul!</h1>
          <p className="text-gray-400 text-sm mb-2">Am trimis un link de resetare la:</p>
          <p className="font-medium text-sage-600 mb-6">{email}</p>
          <p className="text-sm text-gray-400 mb-6">
            Apasă pe link pentru a seta o parolă nouă. Verifică și folderul Spam dacă nu îl găsești.
          </p>
          <Link href="/login" className="text-sage-600 hover:text-sage-700 font-medium text-sm transition-colors">
            Înapoi la autentificare →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">💰 Vibe Budget</Link>
          <p className="text-gray-400 text-sm mt-2">Resetează parola</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <p className="text-sm text-gray-500 mb-5">
            Introdu adresa de email și îți trimitem un link pentru a seta o parolă nouă.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ion@example.com"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-sage w-full py-2.5 bg-sage-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Se trimite..." : "Trimite link de resetare"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            <Link href="/login" className="text-sage-600 hover:text-sage-700 font-medium transition-colors">
              ← Înapoi la autentificare
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
