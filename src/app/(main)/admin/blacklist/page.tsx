import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal";
import { AddManualBlacklistForm } from "@/components/blacklist/AddManualBlacklistForm";
import { AdminBlacklistTable } from "@/components/admin/AdminBlacklistTable";

export const metadata: Metadata = { title: "Admin - Blacklist" };

export default async function AdminBlacklistPage() {
  const supabase = await createClient();
  const admin = await getUser();

  const { data: entries } = await supabase
    .from("blacklist")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <AddManualBlacklistForm adminId={admin!.id} />
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daftar Blacklist ({entries?.length ?? 0} entri)
        </h2>
        <AdminBlacklistTable entries={entries ?? []} />
      </div>
    </div>
  );
}
