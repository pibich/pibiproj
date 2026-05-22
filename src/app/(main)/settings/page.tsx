import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "@/components/profile/AccountSettingsForm";
import { LinkedAccountsSection } from "@/components/profile/LinkedAccountsSection";

export const metadata: Metadata = { title: "Pengaturan Akun" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; oauth_error?: string }>;
}) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const { linked, oauth_error } = await searchParams;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const hasFacebook = authUser?.identities?.some((id) => id.provider === "facebook") ?? false;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola informasi dan keamanan akun kamu</p>
      </div>

      <AccountSettingsForm user={user} />
      <LinkedAccountsSection hasFacebook={hasFacebook} linkedSuccess={linked} oauthError={oauth_error} />
    </div>
  );
}
