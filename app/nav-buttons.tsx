"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NavButtons() {
  const [hoverLogout, setHoverLogout] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      {/* Deloghează-te — alb, fill verde la hover */}
      <button
        onClick={handleLogout}
        onMouseEnter={() => setHoverLogout(true)}
        onMouseLeave={() => setHoverLogout(false)}
        className="btn-white px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg"
      >
        Deloghează-te
      </button>

      {/* Mergi la dashboard — verde, devine alb când hover pe logout */}
      <Link
        href="/dashboard"
        className="relative overflow-hidden px-4 py-2 text-sm font-semibold rounded-lg shadow-sm shadow-sage-200 active:scale-95"
        style={{
          background: hoverLogout ? "#ffffff" : "var(--color-sage-500)",
          color: hoverLogout ? "var(--color-sage-600)" : "#ffffff",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: hoverLogout ? "var(--color-sage-300)" : "transparent",
          transition: "background 0.35s ease, color 0.35s ease, border-color 0.35s ease",
        }}
      >
        Mergi la dashboard →
      </Link>
    </div>
  );
}
