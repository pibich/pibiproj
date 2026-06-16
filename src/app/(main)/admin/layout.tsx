import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const supabase = await createClient();
  const [{ count: pendingReports }, { count: pendingApprovals }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval")
        .neq("seller_id", user.id),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3.5">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg shadow-teal-600/30">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Dashboard Admin
          </h1>
          <p className="text-sm text-gray-500">
            Kelola laporan, persetujuan lelang, dan pengguna
          </p>
        </div>
      </div>

      <AdminTabs
        pendingReports={pendingReports ?? 0}
        pendingApprovals={pendingApprovals ?? 0}
      />

      {children}
    </div>
  );
}
