import Link from "next/link";

export default function TrialExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sage-100/60 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="text-6xl mb-6">⏳</div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Perioada de probă a expirat
        </h1>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          Cele 3 zile de probă gratuită s-au încheiat. Pentru a continua să folosești
          Vibe Budget, contactează-ne pentru a activa un abonament.
        </p>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-sm font-medium text-gray-700 mb-1">Vrei să continui?</p>
          <p className="text-xs text-gray-400 mb-4">
            Scrie-ne la adresa de mai jos și îți activăm accesul.
          </p>
          <a
            href="mailto:contact@vibebudget.ro"
            className="inline-block px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Contactează-ne
          </a>
        </div>

        <Link
          href="/login"
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
        >
          ← Înapoi la login
        </Link>

      </div>
    </div>
  );
}
