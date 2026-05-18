"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Navbar } from "./Navbar";
import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/types/supabase";

export function NavbarWrapper({ user }: { user: Profile | null }) {
  const router = useRouter();
  const locale = useLocale();

  async function handleLogout() {
    await logoutAction();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return <Navbar user={user} onLogout={handleLogout} />;
}
