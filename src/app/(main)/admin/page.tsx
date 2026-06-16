import {
  ClipboardCheck,
  Clock,
  FileWarning,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import {
  AdminReportTable,
  type ReportRow,
} from "@/components/admin/AdminReportTable";
import { StatTile, type StatTint } from "@/components/dashboard/StatTile";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin - Laporan" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const admin = await getUser();

  const [
    { count: totalUsers },
    { count: pendingReports },
    { count: pendingApprovals },
    { count: activeMiddlemen },
    { count: timedOut },
    { data: reports },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("auctions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval")
      .neq("seller_id", admin!.id),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_middleman", true),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gt("buyer_timeout_until", new Date().toISOString()),
    supabase
      .from("reports")
      .select(
        `*,
        reporter:profiles!reporter_id(id, username, name),
        reported:profiles!reported_user_id(id, username, name, buyer_warning_count),
        auction:auctions(id, title)`,
      )
      .order("created_at", { ascending: false }),
  ]);

  const typedReports = (reports ?? []) as unknown as ReportRow[];

  const stats: {
    label: string;
    value: number;
    icon: typeof Users;
    tint: StatTint;
  }[] = [
    {
      label: "Total Pengguna",
      value: totalUsers ?? 0,
      icon: Users,
      tint: "blue",
    },
    {
      label: "Laporan Pending",
      value: pendingReports ?? 0,
      icon: FileWarning,
      tint: "amber",
    },
    {
      label: "Lelang Menunggu",
      value: pendingApprovals ?? 0,
      icon: ClipboardCheck,
      tint: "blue",
    },
    {
      label: "Middleman Aktif",
      value: activeMiddlemen ?? 0,
      icon: ShieldCheck,
      tint: "green",
    },
    { label: "User Timeout", value: timedOut ?? 0, icon: Clock, tint: "red" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            tint={s.tint}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold tracking-tight text-gray-900">
            Laporan Pengguna
          </h2>
          <span className="text-sm text-gray-500">
            {typedReports.filter((r) => r.status === "pending").length} menunggu
          </span>
        </div>
        <AdminReportTable reports={typedReports} adminId={admin!.id} />
      </div>
    </div>
  );
}
