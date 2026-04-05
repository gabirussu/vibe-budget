/**
 * DASHBOARD - /dashboard
 *
 * Server Component - datele sunt preluate direct pe server.
 * Afișează rezumatul financiar: total bani, venituri și cheltuieli luna curentă.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

// Formatează o sumă ca monedă (ex: 1.234,56 RON)
function formatCurrency(amount: number, currency: string = "RON"): string {
  return `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default async function DashboardPage() {
  // 1. Verificăm sesiunea Supabase
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // 2. Preluăm datele userului din public.users
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!userData) {
    redirect("/login");
  }

  const user = userData;

  // 3. Calculăm intervalul lunii curente (format YYYY-MM-DD)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const firstDayOfMonth = `${year}-${month}-01`;
  const lastDayOfMonth = `${year}-${month}-31`;

  // 4. Query 1: Total bani (toate tranzacțiile)
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", authUser.id);

  const totalBalance = (allTransactions ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // 5. Query 2: Venituri luna curentă (amount > 0)
  const { data: incomeTransactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", authUser.id)
    .gt("amount", 0)
    .gte("date", firstDayOfMonth)
    .lte("date", lastDayOfMonth);

  const incomeThisMonth = (incomeTransactions ?? []).reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  // 6. Query 3: Cheltuieli luna curentă (amount < 0)
  const { data: expenseTransactions } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", authUser.id)
    .lt("amount", 0)
    .gte("date", firstDayOfMonth)
    .lte("date", lastDayOfMonth);

  const expensesThisMonth = Math.abs(
    (expenseTransactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
  );

  // 7. Numele lunii curente în română
  const monthNames = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
  ];
  const currentMonthName = monthNames[now.getMonth()];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-gray-900">💰 Vibe Budget</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-teal-600">Dashboard</span>
              <Link href="/dashboard/banks" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Bănci</Link>
              <Link href="/dashboard/categories" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Categorii</Link>
              <Link href="/dashboard/currencies" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Valute</Link>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Tranzacții</span>
              <span className="text-sm text-gray-400 cursor-not-allowed opacity-50">Rapoarte</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name as string}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Conținut */}
      <main className="container mx-auto px-4 py-8">
        {/* Salut */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bună ziua, {user.name as string}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Iată rezumatul tău financiar pentru {currentMonthName} {year}.
          </p>
        </div>

        {/* Carduri rezumat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total bani */}
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Total bani</p>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              {formatCurrency(totalBalance, user.native_currency as string)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Toate tranzacțiile</p>
          </div>

          {/* Venituri luna asta */}
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Venituri</p>
            <p className="text-2xl font-bold text-green-600">
              +{formatCurrency(incomeThisMonth, user.native_currency as string)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{currentMonthName} {year}</p>
          </div>

          {/* Cheltuieli luna asta */}
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Cheltuieli</p>
            <p className="text-2xl font-bold text-red-600">
              -{formatCurrency(expensesThisMonth, user.native_currency as string)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{currentMonthName} {year}</p>
          </div>
        </div>

        {/* Placeholder tranzacții */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Tranzacții recente</h2>
          <p className="text-gray-500 text-sm">
            Nu ai adăugat tranzacții încă. Vom construi această secțiune în următoarea lecție.
          </p>
        </div>
      </main>
    </div>
  );
}
