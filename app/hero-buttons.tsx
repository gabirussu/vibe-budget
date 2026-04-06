"use client";

import Link from "next/link";
import { useState } from "react";

export default function HeroButtons() {
  const [hoverSecondary, setHoverSecondary] = useState(false);

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Buton verde — devine alb când mouse-ul e pe cel alb */}
      <Link
        href="/register"
        className="relative overflow-hidden px-6 py-3 font-semibold rounded-xl shadow-md shadow-sage-200 active:scale-95 transition-colors duration-350"
        style={{
          background: hoverSecondary ? "#ffffff" : "var(--color-sage-500)",
          color: hoverSecondary ? "var(--color-sage-600)" : "#ffffff",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: hoverSecondary ? "var(--color-sage-300)" : "transparent",
          transition: "background 0.35s ease, color 0.35s ease, border-color 0.35s ease",
        }}
      >
        Începe perioada de probă →
      </Link>

      {/* Buton alb — fill verde la hover */}
      <Link
        href="/login"
        className="btn-white px-6 py-3 bg-white text-gray-600 font-medium rounded-xl border border-gray-200 active:scale-95"
        onMouseEnter={() => setHoverSecondary(true)}
        onMouseLeave={() => setHoverSecondary(false)}
      >
        Am deja cont
      </Link>
    </div>
  );
}
