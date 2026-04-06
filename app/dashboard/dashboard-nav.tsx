"use client";

/**
 * DASHBOARD NAV - componentă shared pentru navbar-ul din dashboard
 *
 * Responsive: linkuri inline pe desktop, hamburger menu pe mobil/tabletă.
 * Primește `activePage` pentru a evidenția pagina curentă.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/app/dashboard/user-menu";

const NAV_LINKS = [
  { href: "/dashboard",              label: "Dashboard" },
  { href: "/dashboard/banks",        label: "Bănci" },
  { href: "/dashboard/categories",   label: "Categorii" },
  { href: "/dashboard/currencies",   label: "Valute" },
  { href: "/dashboard/transactions", label: "Tranzacții" },
  { href: "/dashboard/upload",       label: "Import" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 hover:text-sage-600 transition-colors flex-shrink-0"
        >
          💰 Vibe Budget
        </Link>

        {/* Linkuri desktop */}
        <div className="hidden md:flex items-center gap-1 mx-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                isActive(link.href)
                  ? "font-medium text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span className="px-3 py-1.5 text-sm text-gray-300 cursor-not-allowed">
            Rapoarte
          </span>
        </div>

        {/* Dreapta: Setări cont + UserMenu + hamburger */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                isActive("/dashboard/settings")
                  ? "font-medium text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Setări cont
            </Link>
            <UserMenu />
          </div>

          {/* Buton hamburger — doar pe mobil/tabletă */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            aria-label="Deschide meniu"
          >
            {menuOpen ? (
              // X icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Meniu mobil dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 text-sm rounded-lg transition-all ${
                isActive(link.href)
                  ? "font-medium text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span className="px-3 py-2.5 text-sm text-gray-300 cursor-not-allowed">
            Rapoarte
          </span>
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 text-sm rounded-lg transition-all ${
                isActive("/dashboard/settings")
                  ? "font-medium text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Setări cont
            </Link>
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  );
}
