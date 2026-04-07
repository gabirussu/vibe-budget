"use client";

/**
 * PAGINA UPLOAD - /dashboard/upload
 *
 * Import tranzacții din CSV sau Excel.
 * Parsare cu lib/utils/file-parser.ts, preview înainte de import.
 */

import { useState, useRef } from "react";
import DashboardNav from "@/app/dashboard/dashboard-nav";
import { parseCSV, parseExcel, ParsedTransaction } from "@/lib/utils/file-parser";

const BANKS = [
  { value: "bt",         label: "BT — Banca Transilvania", emoji: "🔵" },
  { value: "ing",        label: "ING Bank",                emoji: "🟠" },
  { value: "bcr",        label: "BCR",                     emoji: "🔴" },
  { value: "revolut",    label: "Revolut",                  emoji: "⚫" },
  { value: "raiffeisen", label: "Raiffeisen",               emoji: "🟡" },
  { value: "other",      label: "Altă bancă",               emoji: "🏦" },
];

export default function UploadPage() {
  const [fileName, setFileName]         = useState<string>("");
  const [fileExt, setFileExt]           = useState<string>("");
  const [file, setFile]                 = useState<File | null>(null);
  const [bank, setBank]                 = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Stare parsare
  const [parsing, setParsing]           = useState(false);
  const [parseError, setParseError]     = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedBank = BANKS.find((b) => b.value === bank);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    setFileName(selected.name);
    setFileExt(ext);
    setFile(selected);
    setParseError(null);
    setTransactions([]);

    // Parsare automată la selectarea fișierului
    await parseFile(selected, ext);
  };

  const parseFile = async (selected: File, ext: string) => {
    setParsing(true);
    setParseError(null);
    setTransactions([]);

    try {
      let result;

      if (ext === "csv") {
        result = await parseCSV(selected);
      } else if (ext === "xlsx" || ext === "xls") {
        result = await parseExcel(selected);
      } else {
        setParseError("Format neacceptat. Folosește CSV, XLSX sau XLS.");
        setParsing(false);
        return;
      }

      if (!result.success) {
        setParseError(result.error ?? "Eroare necunoscută la citirea fișierului.");
      } else {
        setTransactions(result.transactions);
      }
    } catch {
      setParseError("Eroare la procesarea fișierului. Încearcă din nou.");
    } finally {
      setParsing(false);
    }
  };

  const handleClear = () => {
    setFileName("");
    setFileExt("");
    setFile(null);
    setParseError(null);
    setTransactions([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const fileIcon = fileExt === "csv" ? "📊" : fileExt === "xlsx" || fileExt === "xls" ? "📗" : "📄";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📂 Import tranzacții</h1>
          <p className="text-gray-500 text-sm mt-1">
            Încarcă un extras bancar în format CSV sau Excel.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-6">
          <div className="space-y-5">

            {/* File input stilizat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fișier (CSV sau Excel)
              </label>
              <div
                onClick={() => !parsing && inputRef.current?.click()}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-dashed transition-all ${
                  parsing
                    ? "border-sage-200 bg-sage-50/60 cursor-wait"
                    : fileName
                    ? "border-sage-300 bg-sage-50 cursor-pointer"
                    : "border-gray-200 bg-gray-50 hover:border-sage-300 hover:bg-sage-50/40 cursor-pointer"
                }`}
              >
                <span className="text-3xl">
                  {parsing ? "⏳" : fileName ? fileIcon : "📁"}
                </span>
                <div className="flex-1 min-w-0">
                  {parsing ? (
                    <>
                      <p className="text-sm font-medium text-sage-700">Se procesează fișierul...</p>
                      <p className="text-xs text-sage-500 mt-0.5">Te rugăm să aștepți</p>
                    </>
                  ) : fileName ? (
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
                {fileName && !parsing && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClear(); }}
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

            {/* Eroare parsare */}
            {parseError && (
              <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-lg flex-shrink-0">❌</span>
                <div>
                  <p className="text-sm font-medium text-red-700">Eroare la citirea fișierului</p>
                  <p className="text-xs text-red-500 mt-0.5">{parseError}</p>
                </div>
              </div>
            )}

            {/* Succes parsare */}
            {!parsing && transactions.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <span className="text-lg">✅</span>
                <p className="text-sm text-green-700">
                  <strong>{transactions.length} tranzacții</strong> detectate și pregătite pentru import.
                </p>
              </div>
            )}

            {/* Dropdown bancă */}
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
          </div>
        </div>

        {/* Preview table */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Previzualizare date</h2>
            <span className="text-xs text-gray-400">
              {parsing ? "Se procesează..." : `${transactions.length} rânduri detectate`}
            </span>
          </div>

          {/* Loading */}
          {parsing && (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">⏳</p>
              <p className="text-sm text-gray-500 font-medium">Se citește fișierul...</p>
              <p className="text-xs text-gray-400 mt-1">Poate dura câteva secunde pentru fișiere mari</p>
            </div>
          )}

          {/* Gol */}
          {!parsing && transactions.length === 0 && !parseError && (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm text-gray-400">Niciun fișier încărcat încă.</p>
              <p className="text-xs text-gray-300 mt-1">Datele vor apărea aici după selectarea fișierului.</p>
            </div>
          )}

          {/* Eroare */}
          {!parsing && parseError && transactions.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">❌</p>
              <p className="text-sm text-gray-500 font-medium">Nu s-au putut citi datele</p>
              <p className="text-xs text-gray-400 mt-1">Verifică formatul fișierului și încearcă din nou.</p>
            </div>
          )}

          {/* Date */}
          {!parsing && transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Data</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Descriere</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Sumă</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Valută</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.slice(0, 50).map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{t.date}</td>
                      <td className="px-6 py-3 max-w-[280px]">
                        <span className="text-sm text-gray-900 truncate block">{t.description}</span>
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <span className={`text-sm font-semibold ${t.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("ro-RO", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-gray-500">{t.currency ?? "RON"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 50 && (
                <div className="px-6 py-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">
                    Se afișează primele 50 din {transactions.length} tranzacții detectate.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
