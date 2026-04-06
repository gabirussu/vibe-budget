"use client";

/**
 * PAGINA LOGIN - /login
 *
 * Autentificare cu email și parolă via Supabase Auth.
 * signInWithPassword() setează cookie-ul de sesiune automat în browser.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Email sau parolă incorectă");
        return;
      }

      // Succes - mergi la dashboard
      router.push("/dashboard");
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">💰 Vibe Budget</Link>
          <p className="text-gray-400 text-sm mt-2">Autentifică-te în contul tău</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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

            {/* Parolă */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parolă
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parola ta"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

            {/* Eroare */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* Buton submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-sage w-full py-2.5 bg-sage-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              {loading ? "Se autentifică..." : "Autentifică-te"}
            </button>
          </form>

          {/* Link forgot password */}
          <p className="text-center mt-3">
            <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-sage-600 transition-colors">
              Ai uitat parola?
            </Link>
          </p>

          {/* Link register */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Nu ai cont încă?{" "}
            <Link href="/register" className="text-sage-600 hover:text-sage-700 font-medium transition-colors">
              Creează unul gratuit
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
            ← Înapoi la pagina principală
          </Link>
        </p>
      </div>
    </div>
  );
}
