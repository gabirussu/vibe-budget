"use client";

/**
 * PAGINA SETĂRI - /dashboard/settings
 *
 * Setările contului utilizatorului.
 * Funcționalități: schimbare parolă.
 */

import { useState } from "react";
import DashboardNav from "@/app/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("Parola nouă trebuie să aibă minim 6 caractere");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Parolele nu coincid");
      return;
    }

    setLoading(true);
    try {
      // Re-autentifică cu parola curentă pentru verificare
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Utilizator negăsit");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setError("Parola curentă este incorectă");
        return;
      }

      // Schimbă parola
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Setări cont</h1>
          <p className="text-gray-500 text-sm mt-1">Gestionează setările contului tău.</p>
        </div>

        {/* Card schimbare parolă */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Schimbă parola</h2>
          <p className="text-sm text-gray-400 mb-5">Introdu parola curentă și apoi parola nouă.</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parola curentă
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Parola ta actuală"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parola nouă
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmă parola nouă
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetă parola nouă"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-sm bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                ✓ Parola a fost schimbată cu succes!
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-sage w-full py-2.5 bg-sage-600 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Se salvează..." : "Schimbă parola"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
