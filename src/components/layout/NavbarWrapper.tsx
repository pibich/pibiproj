"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/types/supabase";
import { Navbar } from "./Navbar";

export function NavbarWrapper({ user }: { user: Profile | null }) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return <Navbar user={user} onLogout={handleLogout} />;
}
