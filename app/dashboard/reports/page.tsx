"use client";

/**
 * PAGINA RAPOARTE - /dashboard/reports
 *
 * Analiză financiară vizuală bazată pe tranzacțiile utilizatorului.
 * Grafice: Pie chart cheltuieli pe categorii + Bar chart evoluție lunară.
 * Filtre perioadă: luna curentă, ultimele 3 luni, ultimele 6 luni, tot.
 * AI Financial Coach: analiză cu health score și sfaturi personalizate.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardNav from "@/app/dashboard/dashboard-nav";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// ─── Tipuri tranzacții ────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  bank_id: string | null;
  category_id: string | null;
  banks: { id: string; name: string; color: string } | null;
  categories: { id: string; name: string; icon: string; type: "income" | "expense" } | null;
}

type PeriodKey = "luna_curenta" | "3_luni" | "6_luni" | "tot";

interface PieSlice {
  name: string;
  value: number;
  icon: string;
  color: string;
  [key: string]: unknown;
}

interface BarMonth {
  month: string;
  cheltuieli: number;
  venituri: number;
}

// ─── Tipuri AI ────────────────────────────────────────────────────────────────

interface FinancialTip {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface FinancialAnalysis {
  healthScore: number;
  healthLabel: string;
  healthExplanation: string;
  tips: FinancialTip[];
  positiveObservation: string;
}

interface CategorySummary {
  name: string;
  icon: string;
  totalSpent: number;
  percentage: number;
}

// ─── Constante grafice ────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#ec4899",
];

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "luna_curenta", label: "Luna curentă" },
  { key: "3_luni",       label: "Ultimele 3 luni" },
  { key: "6_luni",       label: "Ultimele 6 luni" },
  { key: "tot",          label: "Tot" },
];

const MONTHS: Record<string, string> = {
  "01": "Ian", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mai", "06": "Iun", "07": "Iul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Noi", "12": "Dec",
};

// ─── Constante AI card ────────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  "Excelent":         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500" },
  "Bun":              { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    bar: "bg-blue-500" },
  "Acceptabil":       { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200",  bar: "bg-yellow-400" },
  "Necesită atenție": { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  bar: "bg-orange-500" },
  "Critic":           { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     bar: "bg-red-500" },
};

const PRIORITY_ICON: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
};

// ─── Componenta AI Analysis Card ──────────────────────────────────────────────

function AIAnalysisCard({ analysis }: { analysis: FinancialAnalysis }) {
  const config = HEALTH_CONFIG[analysis.healthLabel] ?? HEALTH_CONFIG["Acceptabil"];

  return (
    <div className={`mt-6 rounded-xl border shadow-sm p-6 ${config.bg} ${config.border}`}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">🤖</span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Analiza AI a cheltuielilor tale</h2>
          <p className="text-xs text-gray-500">Generat de Claude AI · doar date agregate, fără tranzacții individuale</p>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-white rounded-xl p-4 mb-5 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Scor sănătate financiară</span>
          <span className={`text-lg font-bold ${config.text}`}>{analysis.healthScore}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${config.bar}`}
            style={{ width: `${analysis.healthScore}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.text}`}>
            {analysis.healthLabel}
          </span>
          <p className="text-xs text-gray-500 text-right">{analysis.healthExplanation}</p>
        </div>
      </div>

      {/* Observație pozitivă */}
      <div className="flex items-start gap-2 bg-white/70 rounded-lg p-3 mb-4">
        <span className="text-base flex-shrink-0">✨</span>
        <p className="text-sm text-gray-700">{analysis.positiveObservation}</p>
      </div>

      {/* Sfaturi */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sfaturi personalizate</h3>
        {analysis.tips.map((tip, i) => (
          <div key={i} className="bg-white/80 rounded-lg p-3.5">
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0 mt-0.5">{PRIORITY_ICON[tip.priority] ?? "💡"}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{tip.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Funcții pure de transformare ─────────────────────────────────────────────

function getPeriodRange(period: PeriodKey): { date_from: string | null; date_to: string | null } {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "luna_curenta") {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    return { date_from: `${y}-${pad(m)}-01`, date_to: fmt(new Date(y, m, 0)) };
  }
  if (period === "3_luni") {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 2);
    from.setDate(1);
    return { date_from: fmt(from), date_to: fmt(today) };
  }
  if (period === "6_luni") {
    const from = new Date(today);
    from.setMonth(from.getMonth() - 5);
    from.setDate(1);
    return { date_from: fmt(from), date_to: fmt(today) };
  }
  return { date_from: null, date_to: null };
}

function buildPieData(transactions: Transaction[]): PieSlice[] {
  const map = new Map<string, { total: number; name: string; icon: string }>();
  for (const t of transactions.filter((t) => t.amount < 0)) {
    const key = t.category_id ?? "__none__";
    const existing = map.get(key);
    if (existing) {
      existing.total += Math.abs(t.amount);
    } else {
      map.set(key, {
        total: Math.abs(t.amount),
        name: t.categories?.name ?? "Necategorizat",
        icon: t.categories?.icon ?? "❓",
      });
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([, v], i) => ({
      name: v.name,
      value: Math.round(v.total * 100) / 100,
      icon: v.icon,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

function buildBarData(transactions: Transaction[]): BarMonth[] {
  const map = new Map<string, { cheltuieli: number; venituri: number }>();
  for (const t of transactions) {
    const key = t.date.slice(0, 7); // YYYY-MM
    const existing = map.get(key) ?? { cheltuieli: 0, venituri: 0 };
    if (t.amount < 0) existing.cheltuieli += Math.abs(t.amount);
    else existing.venituri += t.amount;
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      month: MONTHS[k.slice(5, 7)] + " '" + k.slice(2, 4),
      cheltuieli: Math.round(v.cheltuieli * 100) / 100,
      venituri: Math.round(v.venituri * 100) / 100,
    }));
}

// ─── Componenta principală ────────────────────────────────────────────────────

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [period, setPeriod]             = useState<PeriodKey>("luna_curenta");

  // Stări AI
  const [aiAnalysis, setAiAnalysis] = useState<FinancialAnalysis | null>(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [aiCooldown, setAiCooldown] = useState(false);

  const pieData = useMemo(() => buildPieData(transactions), [transactions]);
  const barData = useMemo(() => buildBarData(transactions), [transactions]);

  const summary = useMemo(() => {
    const totalCheltuieli = transactions
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalVenituri = transactions
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    return {
      totalCheltuieli: Math.round(totalCheltuieli * 100) / 100,
      totalVenituri:   Math.round(totalVenituri * 100) / 100,
      sold:            Math.round((totalVenituri - totalCheltuieli) * 100) / 100,
    };
  }, [transactions]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Resetăm analiza AI la schimbarea perioadei
    setAiAnalysis(null);
    setAiError(null);
    try {
      const { date_from, date_to } = getPeriodRange(period);
      const params = new URLSearchParams();
      if (date_from) params.set("date_from", date_from);
      if (date_to)   params.set("date_to", date_to);
      const res  = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Eroare la încărcare");
      setTransactions(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fmt = (n: number) =>
    n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalCheltuieliPie = pieData.reduce((s, d) => s + d.value, 0);

  // ─── Handler analiză AI ────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (aiLoading || aiCooldown) return;

    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);

    try {
      const topCategories: CategorySummary[] = pieData.slice(0, 8).map((slice) => ({
        name: slice.name,
        icon: slice.icon,
        totalSpent: slice.value,
        percentage:
          totalCheltuieliPie > 0
            ? Math.round((slice.value / totalCheltuieliPie) * 1000) / 10
            : 0,
      }));

      const payload = {
        period,
        summary,
        topCategories,
        monthlyTrends: barData,
        currency: "RON",
      };

      const res  = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Eroare la analiza AI");

      setAiAnalysis(json.data as FinancialAnalysis);

      // Cooldown 60s — previne apeluri repetate
      setAiCooldown(true);
      setTimeout(() => setAiCooldown(false), 60_000);

    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setAiLoading(false);
    }
  };

  // ─── Custom tooltip pentru PieChart ───────────────────────────────────────

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: PieSlice }[] }) => {
    if (!active || !payload?.length) return null;
    const slice = payload[0].payload;
    const pct = totalCheltuieliPie > 0 ? ((slice.value / totalCheltuieliPie) * 100).toFixed(1) : "0";
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-medium text-gray-900">{slice.icon} {slice.name}</p>
        <p className="text-gray-500">{fmt(slice.value)} RON</p>
        <p className="text-gray-400">{pct}% din total</p>
      </div>
    );
  };

  // ─── Custom tooltip pentru BarChart ───────────────────────────────────────

  const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name === "cheltuieli" ? "Cheltuieli" : "Venituri"}: {fmt(p.value)} RON
          </p>
        ))}
      </div>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📊 Rapoarte</h1>
          <p className="text-gray-500 text-sm mt-1">Analiza cheltuielilor și veniturilor tale.</p>
        </div>

        {/* Filtre perioadă */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                period === opt.key
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Carduri sumar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cheltuieli</p>
            <p className="text-2xl font-bold text-red-500">{fmt(summary.totalCheltuieli)} RON</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Venituri</p>
            <p className="text-2xl font-bold text-emerald-500">{fmt(summary.totalVenituri)} RON</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sold net</p>
            <p className={`text-2xl font-bold ${summary.sold >= 0 ? "text-indigo-600" : "text-red-500"}`}>
              {summary.sold >= 0 ? "+" : ""}{fmt(summary.sold)} RON
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <p className="text-3xl mb-3">⏳</p>
            <p className="text-sm text-gray-500 font-medium">Se încarcă rapoartele...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6">
            <span className="text-lg flex-shrink-0">❌</span>
            <div>
              <p className="text-sm font-medium text-red-700">Eroare la încărcarea datelor</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && transactions.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-700 font-medium mb-1">Nicio tranzacție în perioada selectată</p>
            <p className="text-sm text-gray-400">Încearcă o perioadă mai lungă sau importă tranzacții.</p>
          </div>
        )}

        {/* Grafice */}
        {!loading && !error && transactions.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Pie chart — cheltuieli pe categorii */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Cheltuieli pe categorii</h2>
                <p className="text-xs text-gray-400 mb-4">
                  {pieData.length > 0
                    ? `${pieData.length} categori${pieData.length === 1 ? "e" : "i"} · ${fmt(totalCheltuieliPie)} RON total`
                    : "Nicio cheltuială în perioadă"}
                </p>

                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">
                    Nicio cheltuială de afișat
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={52}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legendă custom */}
                    <div className="mt-2 space-y-1.5 max-h-[160px] overflow-y-auto">
                      {pieData.map((slice) => {
                        const pct = totalCheltuieliPie > 0
                          ? ((slice.value / totalCheltuieliPie) * 100).toFixed(1)
                          : "0";
                        return (
                          <div key={slice.name} className="flex items-center gap-2 text-xs">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-gray-700 truncate flex-1">
                              {slice.icon} {slice.name}
                            </span>
                            <span className="text-gray-400 flex-shrink-0">{pct}%</span>
                            <span className="text-gray-600 font-medium flex-shrink-0 w-24 text-right">
                              {fmt(slice.value)} RON
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Bar chart — evoluție lunară */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Evoluție lunară</h2>
                <p className="text-xs text-gray-400 mb-4">
                  {barData.length > 0
                    ? `${barData.length} lun${barData.length === 1 ? "ă" : "i"} cu tranzacții`
                    : "Nicio dată de afișat"}
                </p>

                {barData.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">
                    Nicio dată de afișat
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v)
                        }
                        width={45}
                      />
                      <Tooltip content={<BarTooltip />} />
                      <Legend
                        formatter={(value: string) =>
                          value === "cheltuieli" ? "Cheltuieli" : "Venituri"
                        }
                      />
                      <Bar dataKey="cheltuieli" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="venituri"   fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Tabel top categorii */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Top cheltuieli pe categorii</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {pieData.map((slice, i) => {
                    const pct = totalCheltuieliPie > 0
                      ? (slice.value / totalCheltuieliPie) * 100
                      : 0;
                    return (
                      <div key={slice.name} className="flex items-center gap-4 px-6 py-3.5">
                        <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="text-sm text-gray-900 truncate">
                            {slice.icon} {slice.name}
                          </span>
                        </div>
                        <div className="hidden sm:block flex-1 max-w-[160px]">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: slice.color }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-sm font-semibold text-gray-800 w-28 text-right flex-shrink-0">
                          {fmt(slice.value)} RON
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── AI Financial Coach ─────────────────────────────────────────── */}

            {/* Buton analiză AI */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={aiLoading || aiCooldown}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  aiLoading || aiCooldown
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:shadow-indigo-200"
                }`}
              >
                {aiLoading ? (
                  <>⏳ Se analizează cu AI...</>
                ) : aiCooldown ? (
                  <>🤖 Analiză efectuată</>
                ) : (
                  <>🤖 Analizează cheltuielile cu AI</>
                )}
              </button>
            </div>

            {/* Eroare AI */}
            {aiError && (
              <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-lg flex-shrink-0">❌</span>
                <div>
                  <p className="text-sm font-medium text-red-700">Eroare la analiza AI</p>
                  <p className="text-xs text-red-500 mt-0.5">{aiError}</p>
                </div>
              </div>
            )}

            {/* Card rezultat AI */}
            {aiAnalysis && <AIAnalysisCard analysis={aiAnalysis} />}
          </>
        )}
      </main>
    </div>
  );
}
