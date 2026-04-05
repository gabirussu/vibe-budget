"use client";

/**
 * LOGOUT BUTTON - Client Component
 *
 * Separat de dashboard/page.tsx (care e Server Component).
 * Apelează signOut() din Supabase și redirectează la /login.
 */

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
    >
      Deconectare
    </button>
  );
}
