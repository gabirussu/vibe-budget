"use client";

/**
 * PAGINA TRANZACȚII - /dashboard/transactions
 *
 * Tabel cu toate tranzacțiile, filtre și căutare.
 * Funcționalități: adăugare, editare, ștergere, paginare, valute dinamice.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardNav from "@/app/dashboard/dashboard-nav";

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

interface Currency {
  id: string;
  code: string;
  name: string;
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

interface TransactionFormData {
  date: string;
  description: string;
  amount: string;
  currency: string;
  type: "income" | "expense";
  bank_id: string;
  category_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
  const abs = Math.abs(amount).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount >= 0 ? "+" : "-"} ${abs} ${currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

const PAGE_SIZE = 20;

// ─── Modal formular (adăugare + editare) ──────────────────────────────────────

interface TransactionModalProps {
  mode: "add" | "edit";
  transaction?: Transaction;
  banks: Bank[];
  categories: Category[];
  currencies: Currency[];
  onSave: (data: TransactionFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

function TransactionModal({ mode, transaction, banks, categories, currencies, onSave, onClose, saving, error }: TransactionModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const getInitialType = (): "income" | "expense" => {
    if (transaction) return Number(transaction.amount) >= 0 ? "income" : "expense";
    return "expense";
  };

  const [form, setForm] = useState<TransactionFormData>({
    date: transaction?.date ?? today,
    description: transaction?.description ?? "",
    amount: transaction ? String(Math.abs(Number(transaction.amount))) : "",
    currency: transaction?.currency ?? (currencies[0]?.code || "RON"),
    type: getInitialType(),
    bank_id: transaction?.bank_id ?? "",
    category_id: transaction?.category_id ?? "",
  });
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const set = (field: keyof TransactionFormData, value: string) => {
    if (field === "type") {
      setForm((f) => ({ ...f, type: value as "income" | "expense", category_id: "" }));
    } else {
      setForm((f) => ({ ...f, [field]: value }));
    }
    setErrors((e) => ({ ...e, [field]: "" }));
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
    const finalAmount = form.type === "expense" ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount));
    await onSave({ ...form, amount: String(finalAmount) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "add" ? "Adaugă tranzacție" : "Editează tranzacție"}
          </h2>
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
                  {currencies.length > 0
                    ? currencies.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)
                    : ["RON", "EUR", "USD", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)
                  }
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
                {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
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
            <button type="submit" disabled={saving} className="btn-sage flex-1 px-4 py-2 bg-sage-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Se salvează..." : mode === "add" ? "Adaugă" : "Salvează"}
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
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Paginare
  const [page, setPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Ștergere
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Normalizare diacritice
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Tranzacții filtrate pe client după search
  const filteredTransactions = search
    ? transactions.filter((t) =>
        normalize(t.description).includes(normalize(search)) ||
        normalize(t.banks?.name ?? "").includes(normalize(search)) ||
        normalize(t.categories?.name ?? "").includes(normalize(search))
      )
    : transactions;

  // Paginare
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset pagină la schimbarea filtrelor
  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, filterBank, filterCategory]);

  // ── Fetch bănci + categorii + valute ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/banks").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/currencies").then((r) => r.json()),
    ]).then(([banksJson, catsJson, currJson]) => {
      setBanks(banksJson.data ?? []);
      setCategories(catsJson.data ?? []);
      setCurrencies(currJson.data ?? []);
    });
  }, []);

  // ── Fetch tranzacții ──────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
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
  }, [dateFrom, dateTo, filterBank, filterCategory]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ── Adaugă tranzacție ─────────────────────────────────────────────────────────
  const handleSave = async (data: TransactionFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = modalMode === "edit" && editingTransaction;
      const res = await fetch("/api/transactions", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editingTransaction.id } : {}),
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
      setEditingTransaction(null);
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

  const openAdd = () => {
    setModalMode("add");
    setEditingTransaction(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setModalMode("edit");
    setEditingTransaction(t);
    setFormError(null);
    setModalOpen(true);
  };

  const totalVenituri = filteredTransactions.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalCheltuieli = Math.abs(filteredTransactions.filter((t) => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      {/* Navbar */}
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💳 Tranzacții</h1>
            <p className="text-gray-500 text-sm mt-1">Toate tranzacțiile tale într-un singur loc.</p>
          </div>
          <button
            onClick={openAdd}
            className="btn-sage flex items-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-lg text-sm font-medium shadow-sm"
          >
            + Adaugă tranzacție
          </button>
        </div>

        {/* Filtre */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Caută după descriere..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>
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
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="">Toate băncile</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              <option value="">Toate categoriile</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
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

        {/* Sumar */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
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
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
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
                <button onClick={openAdd} className="btn-sage px-4 py-2 bg-sage-600 text-white rounded-lg text-sm font-medium">
                  + Adaugă tranzacție
                </button>
              )}
            </div>
          )}

          {!loading && filteredTransactions.length > 0 && (
            <>
              {/* Tabel desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Data</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Descriere</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Bancă</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Categorie</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sumă</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{formatDate(t.date)}</span>
                        </td>
                        <td className="px-6 py-3 max-w-[240px]">
                          <span className="text-sm text-gray-900 truncate block">{t.description}</span>
                        </td>
                        <td className="px-6 py-3">
                          {t.banks ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.banks.color }} />
                              <span className="text-sm text-gray-600">{t.banks.name}</span>
                            </div>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          {t.categories ? (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <span>{t.categories.icon}</span>
                              <span>{t.categories.name}</span>
                            </span>
                          ) : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {formatAmount(Number(t.amount), t.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(t)}
                              className="px-3 py-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-700 border border-indigo-100 hover:border-indigo-300 rounded-lg transition-colors"
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              disabled={deletingId === t.id}
                              className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {deletingId === t.id ? "..." : "Șterge"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Listă mobilă */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedTransactions.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{t.categories?.icon ?? "💳"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(t.date)}
                        {t.banks && <span> · <span style={{ color: t.banks.color }}>●</span> {t.banks.name}</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatAmount(Number(t.amount), t.currency)}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                          Editează
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === t.id ? "..." : "Șterge"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginare */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTransactions.length)} din {filteredTransactions.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="px-3 py-1.5 text-xs text-gray-500">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Următor →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <TransactionModal
          mode={modalMode}
          transaction={editingTransaction ?? undefined}
          banks={banks}
          categories={categories}
          currencies={currencies}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTransaction(null); }}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
