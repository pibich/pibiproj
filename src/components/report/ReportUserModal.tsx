"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ReportUserModalProps {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
  auctionId?: string;
}

const REASONS = [
  "bid_run",
  "seller_close_no_reason",
  "fraud",
  "scam",
  "no_payment",
  "other",
] as const;

const REASON_LABELS: Record<string, string> = {
  bid_run: "Bid Run (kabur setelah menang bid)",
  seller_close_no_reason: "Penjual tutup lelang tanpa alasan",
  fraud: "Penipuan",
  scam: "Scam",
  no_payment: "Tidak membayar",
  other: "Lainnya",
};

export function ReportUserModal({
  open,
  onClose,
  reportedUserId,
  reportedUsername,
  auctionId,
}: ReportUserModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleClose() {
    setReason("");
    setDescription("");
    setError(null);
    setSuccess(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          auction_id: auctionId ?? null,
          reason,
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Gagal mengirim laporan");
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Laporkan Pengguna">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="font-medium text-gray-900">
            Laporan berhasil dikirim. Tim kami akan meninjau laporan Anda.
          </p>
          <Button onClick={handleClose} variant="outline">
            Tutup
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Laporkan pelanggaran yang dilakukan oleh pengguna ini:{" "}
            <span className="font-semibold">@{reportedUsername}</span>
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Alasan Laporan <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {REASON_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Keterangan Tambahan
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kejadian yang dialami secara detail..."
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isPending}
              disabled={!reason}
            >
              Kirim Laporan
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
