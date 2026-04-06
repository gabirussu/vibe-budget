"use client";

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
      className="btn-logout px-4 py-2 text-sm font-medium text-red-400 border border-red-200 rounded-lg"
    >
      Deloghează-te
    </button>
  );
}
