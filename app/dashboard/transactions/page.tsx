"use client";

/**
 * PAGINA TRANZACȚII - /dashboard/transactions
 *
 * Tabel cu toate tranzacțiile, filtre și căutare.
 * Buton Adaugă tranzacție → modal cu formular.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import UserMenu from "@/app/dashboard/user-menu";

// ─── Tipuri ───────────────────────────────────────────────────────────────────

interface Bank {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  bank_id: string | null;
  category_id: string | null;
  banks: Bank | null;
  categories: Category | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  const abs = Math.abs(amount).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount >= 0 ? "+" : "-"} ${abs} ${currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Modal adăugare tranzacție ────────────────────────────────────────────────

interface AddTransactionModalProps {
  banks: Bank[];
  categories: Category[];
  onSave: (data: TransactionFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

interface TransactionFormData {
  date: string;
  description: string;
  amount: string;
  currency: string;
  type: "income" | "expense";
  bank_id: string;
  category_id: string;
}

function AddTransactionModal({ banks, categories, onSave, onClose, saving, error }: AddTransactionModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<TransactionFormData>({
    date: today,
    description: "",
    amount: "",
    currency: "RON",
    type: "expense",
    bank_id: "",
    category_id: "",
  });
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const set = (field: keyof TransactionFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
    // Reset category când schimbi tipul
    if (field === "type") setForm((f) => ({ ...f, type: value as "income" | "expense", category_id: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<TransactionFormData> = {};
    if (!form.date) newErrors.date = "Obligatoriu";
    if (!form.description.trim()) newErrors.description = "Obligatoriu";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) newErrors.amount = "Sumă invalidă";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Suma negativă pentru cheltuieli
    const finalAmount = form.type === "expense" ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount));
    await onSave({ ...form, amount: String(finalAmount) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Adaugă tranzacție</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tip: Venit / Cheltuială */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => set("type", "expense")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${form.type === "expense" ? "bg-red-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              🔴 Cheltuială
            </button>
            <button
              type="button"
              onClick={() => set("type", "income")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${form.type === "income" ? "bg-green-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              💚 Venit
            </button>
          </div>

          {/* Dată + Sumă */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 ${errors.date ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-0.5">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sumă</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 ${errors.amount ? "border-red-400" : "border-gray-300"}`}
                />
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                >
                  <option>RON</option>
                  <option>EUR</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-0.5">{errors.amount}</p>}
            </div>
          </div>

          {/* Descriere */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descriere</label>
            <input
              type="text"
              placeholder="ex: Mega Image, Netflix, Salariu..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 ${errors.description ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description}</p>}
          </div>

          {/* Bancă + Categorie */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bancă (opțional)</label>
              <select
                value={form.bank_id}
                onChange={(e) => set("bank_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              >
                <option value="">— nicio bancă —</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categorie (opțional)</label>
              <select
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              >
                <option value="">— nicio categorie —</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Eroare API */}
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Butoane */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Anulează
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? "Se salvează..." : "Adaugă"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pagina principală ────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Helper normalizare diacritice pentru căutare
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Tranzacții filtrate pe client după search (descriere + categorie + bancă)
  const filteredTransactions = search
    ? transactions.filter((t) =>
        normalize(t.description).includes(normalize(search)) ||
        normalize(t.banks?.name ?? "").includes(normalize(search)) ||
        normalize(t.categories?.name ?? "").includes(normalize(search))
      )
    : transactions;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Ștergere
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch bănci + categorii ───────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/banks").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([banksJson, catsJson]) => {
      setBanks(banksJson.data ?? []);
      setCategories(catsJson.data ?? []);
    });
  }, []);

  // ── Fetch tranzacții cu filtre ────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // search se face pe client (pentru suport diacritice)
      if (dateFrom)       params.set("date_from", dateFrom);
      if (dateTo)         params.set("date_to", dateTo);
      if (filterBank)     params.set("bank_id", filterBank);
      if (filterCategory) params.set("category_id", filterCategory);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcare");
      setTransactions(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, filterBank, filterCategory]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ── Adaugă tranzacție ─────────────────────────────────────────────────────────
  const handleSave = async (data: TransactionFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          bank_id: data.bank_id || null,
          category_id: data.category_id || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la salvare");
      setModalOpen(false);
      await fetchTransactions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setSaving(false);
    }
  };

  // ── Șterge tranzacție ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această tranzacție?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la ștergere");
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la ștergere");
    } finally {
      setDeletingId(null);
    }
  };

  const totalVenituri = filteredTransactions.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalCheltuieli = Math.abs(filteredTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-gray-900 hover:text-sage-600 transition-colors">💰 Vibe Budget</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Dashboard</Link>
              <Link href="/dashboard/banks" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Bănci</Link>
              <Link href="/dashboard/categories" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Categorii</Link>
              <Link href="/dashboard/currencies" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Valute</Link>
              <span className="text-sm font-medium text-sage-600">Tranzacții</span>
              <Link href="/dashboard/upload" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Import</Link>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Rapoarte</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💳 Tranzacții</h1>
            <p className="text-gray-500 text-sm mt-1">Toate tranzacțiile tale într-un singur loc.</p>
          </div>
          <button
            onClick={() => { setModalOpen(true); setFormError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            + Adaugă tranzacție
          </button>
        </div>

        {/* Filtre */}
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            {/* Căutare */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Caută după descriere..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>

            {/* Date range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              title="De la data"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              title="Până la data"
            />

            {/* Filtru bancă */}
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="">Toate băncile</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            {/* Filtru categorie */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="">Toate categoriile</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>

            {/* Reset filtre */}
            {(search || dateFrom || dateTo || filterBank || filterCategory) && (
              <button
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setFilterBank(""); setFilterCategory(""); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
              >
                ✕ Resetează
              </button>
            )}
          </div>
        </div>

        {/* Sumar filtre curente */}
        {filteredTransactions.length > 0 && (
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-gray-500">{filteredTransactions.length} tranzacții</span>
            <span className="text-green-600 font-medium">+{totalVenituri.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} venituri</span>
            <span className="text-red-500 font-medium">-{totalCheltuieli.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} cheltuieli</span>
          </div>
        )}

        {/* Eroare */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {/* Tabel */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Se încarcă tranzacțiile...</div>
          )}

          {!loading && filteredTransactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-3">💳</p>
              <p className="text-gray-700 font-medium mb-1">Nicio tranzacție găsită</p>
              <p className="text-gray-400 text-sm mb-4">
                {search || dateFrom || dateTo || filterBank || filterCategory
                  ? "Încearcă să modifici filtrele."
                  : "Adaugă prima ta tranzacție."}
              </p>
              {!search && !dateFrom && !dateTo && !filterBank && !filterCategory && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  + Adaugă tranzacție
                </button>
              )}
            </div>
          )}

          {!loading && filteredTransactions.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Descriere</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Bancă</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Categorie</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sumă</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    {/* Data */}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{formatDate(t.date)}</span>
                    </td>

                    {/* Descriere */}
                    <td className="px-6 py-3 max-w-[240px]">
                      <span className="text-sm text-gray-900 truncate block">{t.description}</span>
                    </td>

                    {/* Bancă */}
                    <td className="px-6 py-3">
                      {t.banks ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.banks.color }}
                          />
                          <span className="text-sm text-gray-600">{t.banks.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Categorie */}
                    <td className="px-6 py-3">
                      {t.categories ? (
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <span>{t.categories.icon}</span>
                          <span>{t.categories.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Sumă */}
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <span className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatAmount(Number(t.amount), t.currency)}
                      </span>
                    </td>

                    {/* Șterge */}
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === t.id ? "..." : "Șterge"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <AddTransactionModal
          banks={banks}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
