"use client";

/**
 * PAGINA CATEGORII - /dashboard/categories
 *
 * Gestionează categoriile de venituri și cheltuieli.
 * Categoriile de sistem nu pot fi șterse, doar cele personalizate.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import UserMenu from "@/app/dashboard/user-menu";

// ─── Tipuri ───────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  is_system_category: boolean;
  created_at: string;
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const INCOME_EMOJIS = [
  "💰", "💵", "💳", "🏦", "📈", "💼", "🎯", "🏆",
  "🎁", "🤝", "💹", "🏠", "🚗", "✈️", "🎓", "💡",
];

const EXPENSE_EMOJIS = [
  "🛒", "🍔", "🏠", "🚗", "💊", "👕", "🎬", "✈️",
  "📱", "💡", "🎓", "🐾", "🏋️", "☕", "🎮", "💇",
];

// ─── Modal formular categorie ─────────────────────────────────────────────────

interface CategoryFormModalProps {
  category: Category | null;
  defaultType: "income" | "expense";
  onSave: (name: string, icon: string, type: "income" | "expense") => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}

function CategoryFormModal({ category, defaultType, onSave, onClose, saving, error }: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "📁");
  const [type] = useState<"income" | "expense">(category?.type ?? defaultType);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const emojis = type === "income" ? INCOME_EMOJIS : EXPENSE_EMOJIS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setNameError("Numele trebuie să aibă cel puțin 2 caractere");
      return;
    }
    setNameError(null);
    await onSave(name.trim(), icon, type);
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
            {category ? "Editează categorie" : `Adaugă categorie de ${type === "income" ? "venit" : "cheltuială"}`}
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
              Numele categoriei
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              placeholder={type === "income" ? "ex: Salariu, Freelance..." : "ex: Mâncare, Transport..."}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 ${
                nameError ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
              autoFocus
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-12 h-12 text-2xl rounded-xl border border-gray-200 hover:border-sage-300 hover:bg-sage-50 transition-colors flex items-center justify-center"
              >
                {icon}
              </button>
              <span className="text-sm text-gray-500">
                {showPicker ? "Alege un emoji:" : "Apasă să schimbi iconul"}
              </span>
            </div>

            {showPicker && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setIcon(e); setShowPicker(false); }}
                      className={`w-9 h-9 text-xl rounded-lg transition-colors hover:bg-sage-100 flex items-center justify-center ${
                        icon === e ? "bg-sage-100 ring-2 ring-sage-400" : ""
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                {/* Input emoji manual */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <input
                    type="text"
                    placeholder="sau scrie un emoji..."
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none"
                    onChange={(e) => { if (e.target.value) setIcon(e.target.value); }}
                  />
                </div>
              </div>
            )}
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
              {saving ? "Se salvează..." : category ? "Salvează" : "Adaugă"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tabel categorii ──────────────────────────────────────────────────────────

interface CategoryTableProps {
  title: string;
  categories: Category[];
  color: "green" | "red";
  onAdd: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

function CategoryTable({ title, categories, color, onAdd, onEdit, onDelete, deletingId }: CategoryTableProps) {
  const accent = color === "green"
    ? { btn: "bg-green-600 hover:bg-green-700", badge: "bg-green-100 text-green-700", ring: "ring-green-400" }
    : { btn: "bg-red-500 hover:bg-red-600", badge: "bg-red-100 text-red-700", ring: "ring-red-400" };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header tabel */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {categories.length} {categories.length === 1 ? "categorie" : "categorii"}
          </p>
        </div>
        <button
          onClick={onAdd}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${accent.btn} text-white rounded-lg text-xs font-medium transition-colors`}
        >
          + Adaugă
        </button>
      </div>

      {/* Lista goală */}
      {categories.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-400 text-sm">
          Nu ai categorii personalizate încă.
        </div>
      )}

      {/* Rânduri */}
      {categories.length > 0 && (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-2.5">
                Categorie
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-2.5">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  {cat.is_system_category ? (
                    <span className="text-xs text-gray-300 italic">protejat</span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(cat)}
                        className="px-3 py-1.5 text-xs font-medium text-sage-600 hover:text-sage-700 border border-sage-200 hover:border-sage-300 rounded-lg transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => onDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === cat.id ? "Se șterge..." : "Șterge"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Pagina principală ────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State ștergere
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcare");
      setCategories(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── Adaugă / editează ─────────────────────────────────────────────────────────
  const handleSave = async (name: string, icon: string, type: "income" | "expense") => {
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = editingCategory !== null;
      const res = await fetch("/api/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit
          ? { id: editingCategory.id, name, icon }
          : { name, icon, type }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la salvare");
      await fetchCategories();
      setModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setSaving(false);
    }
  };

  // ── Șterge ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această categorie?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la ștergere");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la ștergere");
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = (type: "income" | "expense") => {
    setEditingCategory(null);
    setDefaultType(type);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

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
              <span className="text-sm font-medium text-sage-600">Categorii</span>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🗂️ Categorii</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestionează categoriile pentru a organiza tranzacțiile tale.
          </p>
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
            Se încarcă categoriile...
          </div>
        )}

        {/* Cele două tabele */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Venituri */}
            <CategoryTable
              title="💚 Venituri"
              categories={incomeCategories}
              color="green"
              onAdd={() => openAdd("income")}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />

            {/* Cheltuieli */}
            <CategoryTable
              title="🔴 Cheltuieli"
              categories={expenseCategories}
              color="red"
              onAdd={() => openAdd("expense")}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <CategoryFormModal
          category={editingCategory}
          defaultType={defaultType}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
