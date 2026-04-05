"use client";

/**
 * PAGINA BĂNCI - /dashboard/banks
 *
 * Client Component — gestionează starea locală și apelurile API.
 * Permite adăugarea, editarea și ștergerea băncilor utilizatorului.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import UserMenu from "@/app/dashboard/user-menu";

// ─── Tipuri ──────────────────────────────────────────────────────────────────

interface Bank {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// ─── Culori predefinite pentru color picker ───────────────────────────────────

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#64748b", // Slate
  "#78716c", // Stone
  "#000000", // Black
];

// ─── Componentă modal formular ────────────────────────────────────────────────

interface BankFormModalProps {
  bank: Bank | null; // null = adăugare nouă, Bank = editare
  onSave: (name: string, color: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

function BankFormModal({ bank, onSave, onClose, saving, error }: BankFormModalProps) {
  const [name, setName] = useState(bank?.name ?? "");
  const [color, setColor] = useState(bank?.color ?? "#6366f1");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError("Numele trebuie să aibă cel puțin 2 caractere");
      return;
    }
    setNameError(null);
    await onSave(name.trim(), color);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {bank ? "Editează bancă" : "Adaugă bancă nouă"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Câmp Nume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numele băncii
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder="ex: ING Bank, Revolut, BCR..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 ${
                nameError ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
              autoFocus
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">{nameError}</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culoare identificare
            </label>

            {/* Culori predefinite */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#1f2937" : "transparent",
                    boxShadow: color === c ? "0 0 0 2px white inset" : "none",
                  }}
                  title={c}
                />
              ))}
            </div>

            {/* Input hex + preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 cursor-pointer rounded border border-gray-200"
                title="Alege orice culoare"
              />
              <span className="text-sm text-gray-500 font-mono">{color}</span>
            </div>
          </div>

          {/* Eroare API */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Butoane */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Se salvează..." : bank ? "Salvează" : "Adaugă"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pagina principală ────────────────────────────────────────────────────────

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State confirmare ștergere
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch bănci ─────────────────────────────────────────────────────────────
  const fetchBanks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banks");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcarea băncilor");
      setBanks(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // ── Adaugă / editează ────────────────────────────────────────────────────────
  const handleSave = async (name: string, color: string) => {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = editingBank !== null;
      const res = await fetch("/api/banks", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingBank.id, name, color } : { name, color }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la salvare");

      await fetchBanks();
      setModalOpen(false);
      setEditingBank(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setSaving(false);
    }
  };

  // ── Șterge ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această bancă?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/banks?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la ștergere");
      await fetchBanks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la ștergere");
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = () => {
    setEditingBank(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingBank(null);
    setFormError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900 hover:text-sage-600 transition-colors">💰 Vibe Budget</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Dashboard
              </Link>
              <span className="text-sm font-medium text-sage-600">Bănci</span>
              <Link href="/dashboard/categories" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Categorii</Link>
              <Link href="/dashboard/currencies" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Valute</Link>
              <Link href="/dashboard/transactions" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Tranzacții</Link>
              <Link href="/dashboard/upload" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Import</Link>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Rapoarte</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </nav>

      {/* Conținut */}
      <main className="container mx-auto px-4 py-8">
        {/* Header pagină */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏦 Băncile mele</h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestionează băncile și conturile tale pentru urmărirea tranzacțiilor.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Adaugă bancă
          </button>
        </div>

        {/* Eroare globală */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white shadow rounded-lg p-8 text-center text-gray-400 text-sm">
            Se încarcă băncile...
          </div>
        )}

        {/* Lista goală */}
        {!loading && banks.length === 0 && !error && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-700 font-medium mb-1">Nu ai adăugat nicio bancă încă</p>
            <p className="text-gray-400 text-sm mb-4">
              Adaugă băncile tale pentru a putea urmări tranzacțiile pe conturi.
            </p>
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Adaugă prima bancă
            </button>
          </div>
        )}

        {/* Tabel bănci */}
        {!loading && banks.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Bancă
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Adăugată
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50 transition-colors">
                    {/* Nume + indicator culoare */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                          style={{ backgroundColor: bank.color }}
                        >
                          {bank.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{bank.name}</span>
                      </div>
                    </td>

                    {/* Data */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(bank.created_at).toLocaleDateString("ro-RO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Acțiuni */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(bank)}
                          className="px-3 py-1.5 text-xs font-medium text-sage-600 hover:text-sage-700 border border-sage-200 hover:border-sage-300 rounded-lg transition-colors"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDelete(bank.id)}
                          disabled={deletingId === bank.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === bank.id ? "Se șterge..." : "Șterge"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer tabel */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {banks.length} {banks.length === 1 ? "bancă adăugată" : "bănci adăugate"}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modal adăugare / editare */}
      {modalOpen && (
        <BankFormModal
          bank={editingBank}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
