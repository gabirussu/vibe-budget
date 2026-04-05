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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-gray-600 mt-1">Autentifică-te în contul tău</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ion@example.com"
              required
              className="border border-gray-300 rounded px-3 py-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Parolă */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parolă
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parola ta"
              required
              className="border border-gray-300 rounded px-3 py-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Eroare */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Buton submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded w-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Se autentifică..." : "Autentifică-te"}
          </button>
        </form>

        {/* Link register */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Nu ai cont încă?{" "}
          <Link href="/register" className="text-teal-600 hover:underline font-medium">
            Creează unul gratuit
          </Link>
        </p>
      </div>
    </div>
  );
}
