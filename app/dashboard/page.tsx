/**
 * DASHBOARD - /dashboard
 *
 * Server Component - datele sunt preluate direct pe server.
 * Afișează rezumatul financiar: total bani, venituri și cheltuieli luna curentă.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "./dashboard-nav";

function formatCurrency(amount: number, currency: string = "RON"): string {
  return `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: userData } = await supabase
    .from("users").select("*").eq("id", authUser.id).single();
  if (!userData) redirect("/login");

  const user = userData;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const firstDayOfMonth = `${year}-${month}-01`;
  const lastDayOfMonth  = new Date(year, now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: allTransactions } = await supabase
    .from("transactions").select("amount").eq("user_id", authUser.id);
  const totalBalance = (allTransactions ?? []).reduce((s, t) => s + Number(t.amount), 0);

  const { data: incomeTransactions } = await supabase
    .from("transactions").select("amount").eq("user_id", authUser.id)
    .gt("amount", 0).gte("date", firstDayOfMonth).lte("date", lastDayOfMonth);
  const incomeThisMonth = (incomeTransactions ?? []).reduce((s, t) => s + Number(t.amount), 0);

  const { data: expenseTransactions } = await supabase
    .from("transactions").select("amount").eq("user_id", authUser.id)
    .lt("amount", 0).gte("date", firstDayOfMonth).lte("date", lastDayOfMonth);
  const expensesThisMonth = Math.abs(
    (expenseTransactions ?? []).reduce((s, t) => s + Number(t.amount), 0)
  );

  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("id, date, description, amount, currency, banks(name, color), categories(name, icon)")
    .eq("user_id", authUser.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const monthNames = ["ianuarie","februarie","martie","aprilie","mai","iunie",
    "iulie","august","septembrie","octombrie","noiembrie","decembrie"];
  const currentMonthName = monthNames[now.getMonth()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white">
      {/* Navbar */}
      <DashboardNav />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bună, {(user.name as string).split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Rezumatul tău financiar pentru <span className="font-medium text-gray-700">{currentMonthName} {year}</span>
          </p>
        </div>

        {/* Carduri rezumat financiar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden hover:shadow-indigo-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">💼</div>
                <p className="text-sm font-medium text-gray-500">Total bani</p>
              </div>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
                {formatCurrency(totalBalance, (user.native_currency ?? user.nativeCurrency ?? "RON") as string)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Toate tranzacțiile</p>
            </div>
          </div>

          {/* Venituri */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden hover:shadow-green-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">📈</div>
                <p className="text-sm font-medium text-gray-500">Venituri</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                +{formatCurrency(incomeThisMonth, user.native_currency as string)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{currentMonthName} {year}</p>
            </div>
          </div>

          {/* Cheltuieli */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden hover:shadow-red-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">📉</div>
                <p className="text-sm font-medium text-gray-500">Cheltuieli</p>
              </div>
              <p className="text-2xl font-bold text-red-500">
                -{formatCurrency(expensesThisMonth, user.native_currency as string)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{currentMonthName} {year}</p>
            </div>
          </div>
        </div>

        {/* Navigație rapidă */}
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigare rapidă</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {[
            { href: "/dashboard/banks",        emoji: "🏦", label: "Bănci",           desc: "Gestionează conturile tale" },
            { href: "/dashboard/categories",   emoji: "🗂️", label: "Categorii",       desc: "Venituri și cheltuieli" },
            { href: "/dashboard/currencies",   emoji: "💱", label: "Valute",           desc: "RON, EUR, USD și altele" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-indigo-100 hover:border-indigo-200 hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-xl transition-colors flex-shrink-0">
                {item.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-indigo-400 transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {[
            { href: "/dashboard/transactions", emoji: "💳", label: "Tranzacții",      desc: "Vezi și adaugă tranzacții", color: "teal" },
            { href: "/dashboard/upload",       emoji: "📂", label: "Import CSV/Excel", desc: "Importă extras bancar",     color: "teal" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-lg hover:shadow-teal-100 hover:border-sage-200 hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-sage-50 group-hover:bg-sage-100 flex items-center justify-center text-xl transition-colors flex-shrink-0">
                {item.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-teal-400 transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>

        {/* Tranzacții recente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Tranzacții recente</h2>
            <Link href="/dashboard/transactions" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Vezi toate →
            </Link>
          </div>

          {(!recentTransactions || recentTransactions.length === 0) ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-sm text-gray-500 font-medium">Nicio tranzacție recentă</p>
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                + Adaugă tranzacție
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <tbody className="divide-y divide-gray-50">
                {recentTransactions.map((t) => {
                  const bank = t.banks as unknown as { name: string; color: string } | null;
                  const cat  = t.categories as unknown as { name: string; icon: string } | null;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-base sm:text-lg flex-shrink-0">{cat?.icon ?? "💳"}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(t.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                              {bank && <span className="hidden sm:inline"> · <span style={{ color: bank.color }}>●</span> {bank.name}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">
                        <span className={`text-sm font-semibold ${Number(t.amount) >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toLocaleString("ro-RO", { minimumFractionDigits: 2 })} {t.currency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
