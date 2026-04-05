"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 active:scale-95 text-indigo-700 text-sm font-medium rounded-lg transition-all"
    >
      Deconectează-te
    </button>
  );
}
