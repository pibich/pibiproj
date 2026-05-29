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
      .eq("status", "pending_approval"),
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

  const stats = [
    {
      label: "Total Pengguna",
      value: totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Laporan Pending",
      value: pendingReports ?? 0,
      icon: FileWarning,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Lelang Menunggu",
      value: pendingApprovals ?? 0,
      icon: ClipboardCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Middleman Aktif",
      value: activeMiddlemen ?? 0,
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "User Timeout",
      value: timedOut ?? 0,
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}
            >
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {s.value}
              </p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
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
