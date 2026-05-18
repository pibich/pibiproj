"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export type ReportRow = {
  id: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "approved" | "rejected";
  created_at: string;
  reporter: { id: string; username: string; name: string } | null;
  reported: { id: string; username: string; name: string; buyer_warning_count: number } | null;
  auction: { id: string; title: string } | null;
};

const reasonLabels: Record<string, string> = {
  bid_run: "Bid Run",
  seller_close_no_reason: "Penjual tutup tanpa alasan",
  fraud: "Penipuan",
  scam: "Scam",
  no_payment: "Tidak membayar",
  other: "Lainnya",
};

export function AdminReportTable({
  reports,
  adminId,
}: {
  reports: ReportRow[];
  adminId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  async function updateStatus(
    reportId: string,
    status: "approved" | "rejected",
    reviewedBy: string
  ) {
    startTransition(async () => {
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewed_by: reviewedBy }),
      });
      router.refresh();
    });
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="warning">Menunggu</Badge>;
      case "approved": return <Badge variant="danger">Disetujui</Badge>;
      case "rejected": return <Badge variant="default">Ditolak</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit text-sm">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "all" ? "Semua" : f === "pending" ? "Menunggu" : f === "approved" ? "Disetujui" : "Ditolak"}
            {f === "pending" && (
              <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
                {reports.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Tidak ada laporan</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(report.status)}
                    <Badge variant="outline">{reasonLabels[report.reason] ?? report.reason}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(report.created_at)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Pelapor</p>
                      <p className="font-medium text-gray-900">
                        {report.reporter?.name ?? "Unknown"}
                      </p>
                      <p className="text-gray-500">@{report.reporter?.username}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Dilaporkan</p>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-900">
                          {report.reported?.name ?? "Unknown"}
                        </p>
                        {(report.reported?.buyer_warning_count ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            {report.reported?.buyer_warning_count}x
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500">@{report.reported?.username}</p>
                    </div>
                  </div>

                  {report.auction && (
                    <p className="text-xs text-gray-500">
                      Lelang: {report.auction.title}
                    </p>
                  )}

                  {report.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5 italic">
                      "{report.description}"
                    </p>
                  )}
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="danger"
                      loading={isPending}
                      onClick={() => updateStatus(report.id, "approved", adminId)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={isPending}
                      onClick={() => updateStatus(report.id, "rejected", adminId)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
