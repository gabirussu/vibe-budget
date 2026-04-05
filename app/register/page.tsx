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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifică emailul!</h1>
          <p className="text-gray-600 mb-2">
            Am trimis un link de confirmare la:
          </p>
          <p className="font-medium text-teal-600 mb-6">{email}</p>
          <p className="text-sm text-gray-500 mb-6">
            Deschide emailul și apasă pe link pentru a-ți activa contul. Verifică și folderul Spam dacă nu îl găsești.
          </p>
          <Link
            href="/login"
            className="text-teal-600 hover:underline font-medium text-sm"
          >
            Mergi la autentificare →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-gray-600 mt-1">Creează un cont nou</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nume
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ion Popescu"
              required
              className="border border-gray-300 rounded px-3 py-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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
              placeholder="Minim 6 caractere"
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
            {loading ? "Se creează contul..." : "Creează cont"}
          </button>
        </form>

        {/* Link login */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Ai deja un cont?{" "}
          <Link href="/login" className="text-teal-600 hover:underline font-medium">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
}
