"use client";

/**
 * PAGINA VALUTE - /dashboard/currencies
 *
 * Gestionează valutele utilizatorului.
 * Preset-uri pentru RON, EUR, USD, GBP + adăugare manuală.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Tipuri ───────────────────────────────────────────────────────────────────

interface Currency {
  id: string;
  user_id: string;
  code: string;
  symbol: string;
  name: string;
  created_at: string;
}

// ─── Valute preset ────────────────────────────────────────────────────────────

const PRESETS = [
  { code: "RON", symbol: "lei", name: "Leu românesc" },
  { code: "EUR", symbol: "€",   name: "Euro" },
  { code: "USD", symbol: "$",   name: "Dolar american" },
  { code: "GBP", symbol: "£",   name: "Liră sterlină" },
];

// ─── Pagina principală ────────────────────────────────────────────────────────

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formular adăugare manuală
  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ștergere
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Preset în curs de adăugare
  const [addingPreset, setAddingPreset] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchCurrencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/currencies");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcare");
      setCurrencies(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCurrencies(); }, []);

  // ── Adaugă preset ─────────────────────────────────────────────────────────────
  const handleAddPreset = async (preset: typeof PRESETS[0]) => {
    setAddingPreset(preset.code);
    setError(null);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preset),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) return; // Există deja — ignorăm silențios
        throw new Error(json.error ?? "Eroare la adăugare");
      }
      await fetchCurrencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setAddingPreset(null);
    }
  };

  // ── Adaugă manual ─────────────────────────────────────────────────────────────
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (code.trim().length < 2) { setFormError("Codul trebuie să aibă cel puțin 2 caractere"); return; }
    if (!symbol.trim()) { setFormError("Simbolul este obligatoriu"); return; }
    if (name.trim().length < 2) { setFormError("Numele trebuie să aibă cel puțin 2 caractere"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, symbol, name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la adăugare");
      setCode(""); setSymbol(""); setName("");
      await fetchCurrencies();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setSaving(false);
    }
  };

  // ── Șterge ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/currencies?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la ștergere");
      await fetchCurrencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la ștergere");
    } finally {
      setDeletingId(null);
    }
  };

  const existingCodes = currencies.map((c) => c.code);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">💰 Vibe Budget</span>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Dashboard</Link>
              <Link href="/dashboard/banks" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Bănci</Link>
              <Link href="/dashboard/categories" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Categorii</Link>
              <span className="text-sm font-medium text-indigo-600">Valute</span>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Tranzacții</span>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Rapoarte</span>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Înapoi
          </Link>
        </div>
      </nav>

      {/* Conținut */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">💱 Valute</h1>
          <p className="text-gray-500 text-sm mt-1">
            Adaugă valutele pe care le folosești pentru a urmări tranzacțiile.
          </p>
        </div>

        {/* Eroare globală */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Preset-uri */}
        <div className="bg-white shadow rounded-lg p-5 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Adaugă rapid valute populare</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const exists = existingCodes.includes(preset.code);
              return (
                <button
                  key={preset.code}
                  onClick={() => !exists && handleAddPreset(preset)}
                  disabled={exists || addingPreset === preset.code}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    exists
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  <span className="font-mono font-bold text-xs">{preset.code}</span>
                  <span>{preset.symbol}</span>
                  <span className="text-gray-400 text-xs">{preset.name}</span>
                  {exists && <span className="text-green-500 text-xs ml-1">✓</span>}
                  {addingPreset === preset.code && <span className="text-xs">...</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formular adăugare manuală */}
        <div className="bg-white shadow rounded-lg p-5 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Adaugă o altă valută</p>
          <form onSubmit={handleAddManual} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Cod (ex: CHF)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CHF"
                maxLength={5}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono uppercase"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Simbol (ex: Fr)</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Fr"
                maxLength={5}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs text-gray-500">Nume complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Franc elvețian"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "..." : "+ Adaugă"}
            </button>
          </form>
          {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
        </div>

        {/* Tabel valute */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Valutele mele</h2>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Se încarcă valutele...
            </div>
          )}

          {!loading && currencies.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Nu ai adăugat nicio valută încă. Folosește preset-urile de mai sus.
            </div>
          )}

          {!loading && currencies.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Cod</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Simbol</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Nume</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {currency.code}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-base text-gray-700">{currency.symbol}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-600">{currency.name}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(currency.id)}
                        disabled={deletingId === currency.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === currency.id ? "Se șterge..." : "Șterge"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td colSpan={4} className="px-6 py-3">
                    <span className="text-xs text-gray-400">
                      {currencies.length} {currencies.length === 1 ? "valută" : "valute"} adăugate
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
