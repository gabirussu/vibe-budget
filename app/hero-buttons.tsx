"use client";

import Link from "next/link";

export default function HeroButtons() {
  return (
    <div className="flex items-center justify-center gap-4 group/hero">
      {/* Verde → devine alb când mouse-ul e pe el SAU pe cel alb */}
      <Link
        href="/register"
        className="hero-btn-primary px-6 py-3 text-white font-semibold rounded-xl shadow-md shadow-sage-200 active:scale-95"
      >
        Începe perioada de probă →
      </Link>
      {/* Alb → devine verde la hover */}
      <Link
        href="/login"
        className="hero-btn-secondary px-6 py-3 text-gray-600 font-medium rounded-xl border border-gray-200 active:scale-95"
      >
        Am deja cont
      </Link>
    </div>
  );
}
