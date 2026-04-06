"use client";

/**
 * PAGINA REGISTER - /register
 *
 * Formular de înregistrare cont nou.
 * Trimite datele la /api/auth/register, apoi redirectează la /login.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare la înregistrare");
        return;
      }

      // Succes - afișăm mesaj de verificare email
      setSuccess(true);
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  // Ecran de succes - verificare email
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 w-full max-w-md text-center shadow-sm">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifică emailul!</h1>
          <p className="text-gray-400 mb-2 text-sm">Am trimis un link de confirmare la:</p>
          <p className="font-medium text-sage-600 mb-6">{email}</p>
          <p className="text-sm text-gray-400 mb-6">
            Deschide emailul și apasă pe link pentru a-ți activa contul. Verifică și folderul Spam dacă nu îl găsești.
          </p>
          <Link href="/login" className="text-sage-600 hover:text-sage-700 font-medium text-sm transition-colors">
            Mergi la autentificare →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">💰 Vibe Budget</Link>
          <p className="text-gray-400 text-sm mt-2">Creează un cont nou</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nume
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ion Popescu"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

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
                placeholder="Minim 6 caractere"
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
              {loading ? "Se creează contul..." : "Creează cont gratuit"}
            </button>
          </form>

          {/* Link login */}
          <p className="text-center text-sm text-gray-400 mt-5">
            Ai deja un cont?{" "}
            <Link href="/login" className="text-sage-600 hover:text-sage-700 font-medium transition-colors">
              Autentifică-te
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
