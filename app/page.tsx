import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import HeroButtons from "./hero-buttons";

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
            <>
              <LogoutButton />
              <Link
                href="/dashboard"
                className="btn-sage px-4 py-2 text-sm font-semibold bg-sage-500 active:scale-95 text-white rounded-lg shadow-sm shadow-sage-200"
              >
                Mergi la dashboard →
              </Link>
            </>
          ) : (
            <>
          <Link
            href="/login"
            className="btn-white px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg"
          >
            Autentifică-te
          </Link>
          <Link
            href="/register"
            className="btn-sage px-4 py-2 text-sm font-semibold bg-sage-500 active:scale-95 text-white rounded-lg shadow-sm shadow-sage-200"
          >
            Creează cont
          </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-20 pb-24 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sage-100 to-sage-50 border border-sage-200 text-sage-700 text-base font-semibold italic mb-8 shadow-sm shadow-sage-100 hover:shadow-md hover:shadow-sage-200 hover:-translate-y-0.5 transition-all tracking-wide" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
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
          <HeroButtons />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24 max-w-5xl">
        {/* Rândul 1 — 3 carduri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
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
        </div>

        {/* Rândul 2 — 2 carduri centrate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:w-2/3 lg:mx-auto">
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
            className="btn-sage inline-block px-6 py-3 bg-sage-500 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-sage-200"
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
