import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white text-gray-900">

      {/* Navbar */}
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:text-sage-600 transition-colors">💰 Vibe Budget</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold bg-sage-500 hover:bg-sage-600 active:scale-95 text-white rounded-lg transition-all shadow-sm shadow-sage-200"
            >
              Mergi la dashboard →
            </Link>
          ) : (
            <>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Autentifică-te
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-sage-500 hover:bg-sage-600 active:scale-95 text-white rounded-lg transition-all shadow-sm shadow-sage-200"
          >
            Creează cont
          </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-24 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-50 border border-sage-100 text-sage-600 text-xs font-medium mb-8">
          ✨ Simplu. Inteligent. Al tău.
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6 text-gray-900">
          Banii tăi.<br />
          <span className="text-sage-600">Regulile tale.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Vibe Budget te ajută să înțelegi exact unde ți se duc banii — fără foi de calcul, fără bătăi de cap.
          Adaugi băncile tale, încarci extrasele și în câteva secunde ai o imagine clară a finanțelor tale personale.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-400 hover:to-sage-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-md shadow-sage-200 hover:shadow-lg hover:shadow-sage-200 hover:-translate-y-0.5"
          >
            Începe perioada de probă →
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white hover:bg-sage-50 text-gray-600 hover:text-sage-700 font-medium rounded-xl border border-gray-200 hover:border-sage-200 transition-all hover:-translate-y-0.5"
          >
            Am deja cont
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-3xl mb-4">🏦</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-bancă</h3>
            <p className="text-sm text-gray-400">
              Adaugă toate băncile tale — ING, BT, Revolut, BCR — și urmărește toate conturile într-un singur loc.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Dashboard financiar</h3>
            <p className="text-sm text-gray-400">
              Vizualizează soldul total, veniturile și cheltuielile lunare dintr-o privire.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-3xl mb-4">🗂️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Categorii personalizate</h3>
            <p className="text-sm text-gray-400">
              Organizează tranzacțiile pe categorii — Mâncare, Transport, Locuință — și vezi exact unde cheltuiești.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-3xl mb-4">💱</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-valută</h3>
            <p className="text-sm text-gray-400">
              Suport pentru RON, EUR, USD, GBP și orice altă valută pe care o folosești.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-3xl mb-4">📂</div>
            <h3 className="font-semibold text-gray-900 mb-2">Import extrase bancare</h3>
            <p className="text-sm text-gray-400">
              Importă extrasele bancare în format CSV sau Excel direct din aplicația băncii tale.
            </p>
          </div>

        </div>
      </section>

      {/* CTA final */}
      <section className="container mx-auto px-6 pb-24 text-center max-w-xl">
        <div className="bg-gradient-to-br from-sage-50 to-sage-100/50 border border-sage-100 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Gata să începi?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Începe gratuit azi — 3 zile să explorezi tot ce oferă aplicația, fără card și fără obligații.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-400 hover:to-sage-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-md shadow-sage-200 hover:shadow-lg hover:shadow-sage-200 hover:-translate-y-0.5"
          >
            Creează cont →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Vibe Budget
      </footer>

    </div>
  );
}
