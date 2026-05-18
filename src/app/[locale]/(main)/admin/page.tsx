import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal";
import { AdminReportTable, type ReportRow } from "@/components/admin/AdminReportTable";

export const metadata: Metadata = { title: "Admin - Laporan" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const admin = await getUser();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      `*,
      reporter:profiles!reporter_id(id, username, name),
      reported:profiles!reported_user_id(id, username, name, violation_count),
      auction:auctions(id, title)`
    )
    .order("created_at", { ascending: false });

  const typedReports = (reports ?? []) as unknown as ReportRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Laporan Pengguna</h2>
        <span className="text-sm text-gray-500">
          {typedReports.filter((r) => r.status === "pending").length} menunggu
        </span>
      </div>
      <AdminReportTable reports={typedReports} adminId={admin!.id} />
    </div>
  );
}
