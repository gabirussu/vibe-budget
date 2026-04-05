"use client";

/**
 * PAGINA UPLOAD - /dashboard/upload
 *
 * Import tranzacții din CSV sau Excel.
 * Logica de parsing se implementează în Săptămâna 5.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import UserMenu from "@/app/dashboard/user-menu";

const BANKS = [
  { value: "bt",         label: "BT — Banca Transilvania", emoji: "🔵" },
  { value: "ing",        label: "ING Bank",                emoji: "🟠" },
  { value: "bcr",        label: "BCR",                     emoji: "🔴" },
  { value: "revolut",    label: "Revolut",                  emoji: "⚫" },
  { value: "raiffeisen", label: "Raiffeisen",               emoji: "🟡" },
  { value: "other",      label: "Altă bancă",               emoji: "🏦" },
];

export default function UploadPage() {
  const [fileName, setFileName]     = useState<string>("");
  const [fileExt, setFileExt]       = useState<string>("");
  const [bank, setBank]             = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showInfo, setShowInfo]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBank = BANKS.find((b) => b.value === bank);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileExt(file.name.split(".").pop()?.toLowerCase() ?? "");
      setShowInfo(false);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setShowInfo(true);
  };

  const fileIcon = fileExt === "csv" ? "📊" : fileExt === "xlsx" || fileExt === "xls" ? "📗" : "📄";

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
              <Link href="/dashboard/transactions" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Tranzacții</Link>
              <span className="text-sm font-medium text-sage-600">Import</span>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Rapoarte</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📂 Import tranzacții</h1>
          <p className="text-gray-500 text-sm mt-1">
            Încarcă un extras bancar în format CSV sau Excel.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-xl p-6 mb-6">
          <form onSubmit={handleUpload} className="space-y-5">

            {/* File input stilizat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fișier (CSV sau Excel)
              </label>
              <div
                onClick={() => inputRef.current?.click()}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  fileName
                    ? "border-sage-300 bg-sage-50"
                    : "border-gray-200 bg-gray-50 hover:border-sage-300 hover:bg-sage-50/40"
                }`}
              >
                <span className="text-3xl">{fileName ? fileIcon : "📁"}</span>
                <div className="flex-1 min-w-0">
                  {fileName ? (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                      <p className="text-xs text-sage-600 mt-0.5">Fișier selectat — apasă să schimbi</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700">Apasă să alegi fișierul</p>
                      <p className="text-xs text-gray-400 mt-0.5">CSV, XLSX sau XLS acceptate</p>
                    </>
                  )}
                </div>
                {fileName && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFileName(""); setFileExt(""); if (inputRef.current) inputRef.current.value = ""; }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors text-sm flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Dropdown bancă modern */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bancă
              </label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                  dropdownOpen
                    ? "border-teal-400 ring-2 ring-teal-100 bg-white"
                    : "border-gray-200 bg-gray-50 hover:border-sage-300 hover:bg-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {selectedBank ? (
                    <>
                      <span>{selectedBank.emoji}</span>
                      <span className="text-gray-900 font-medium">{selectedBank.label}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">— selectează banca —</span>
                  )}
                </span>
                <span className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {BANKS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => { setBank(b.value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-sage-50 ${
                        bank === b.value ? "bg-sage-50 text-sage-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      <span className="text-base">{b.emoji}</span>
                      <span>{b.label}</span>
                      {bank === b.value && <span className="ml-auto text-sage-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buton Upload teal */}
            <button
              type="submit"
              className="w-full py-3 bg-sage-600 hover:bg-sage-700 active:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sage-200"
            >
              ↑ Upload fișier
            </button>

            {/* Mesaj informativ */}
            {showInfo && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-lg">🚧</span>
                <p className="text-sm text-amber-700">
                  Upload va fi funcțional în <strong>Săptămâna 5, Lecția 5.1</strong>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Preview table */}
        <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Previzualizare date</h2>
            <span className="text-xs text-gray-400">0 rânduri detectate</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Data</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Descriere</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sumă</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Valută</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 transition-colors">
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm text-gray-400">Niciun fișier încărcat încă.</p>
                  <p className="text-xs text-gray-300 mt-1">Datele vor apărea aici după upload.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
