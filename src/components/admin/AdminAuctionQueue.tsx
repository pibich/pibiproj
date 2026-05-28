"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatIDR } from "@/lib/utils";

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

export type AuctionQueueRow = {
  id: string;
  title: string;
  description: string | null;
  condition: string;
  images: string[];
  starting_price: number;
  buy_now_price: number | null;
  end_time: string | null;
  created_at: string;
  seller: { username: string; name: string } | null;
};

export function AdminAuctionQueue({
  auctions,
}: {
  auctions: AuctionQueueRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAction(
    auctionId: string,
    action: "approve" | "reject",
    adminNote?: string,
  ) {
    setLoadingId(auctionId);
    setLoadingAction(action);
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/admin/auctions/${auctionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, admin_note: adminNote }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Gagal memproses lelang");
      } else {
        setRejectingId(null);
        setRejectNote("");
      }

      setLoadingId(null);
      setLoadingAction(null);
      router.refresh();
    });
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
          Tidak ada lelang yang menunggu persetujuan
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {auctions.map((auction) => {
        const isLoading = loadingId === auction.id;
        const isRejecting = rejectingId === auction.id;

        return (
          <div
            key={auction.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
              {auction.images?.[0] ? (
                <img
                  src={auction.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  No image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-snug">
                {auction.title}
              </p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="default" className="text-xs">
                  {conditionLabels[auction.condition] ?? auction.condition}
                </Badge>
                <span className="text-xs text-gray-500">
                  oleh @{auction.seller?.username ?? "—"}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 flex-wrap">
                <span>Mulai: {formatIDR(auction.starting_price)}</span>
                {auction.buy_now_price != null && (
                  <span className="text-blue-600">
                    Buy Now: {formatIDR(auction.buy_now_price)}
                  </span>
                )}
              </div>

              {auction.end_time && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  Berakhir: {formatDate(auction.end_time, "id")}
                </div>
              )}

              {auction.description && (
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                  {auction.description}
                </p>
              )}

              {/* Inline reject form */}
              {isRejecting && (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Alasan penolakan (opsional, akan ditampilkan ke seller)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectNote("");
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={isLoading && loadingAction === "reject"}
                      onClick={() =>
                        handleAction(
                          auction.id,
                          "reject",
                          rejectNote || undefined,
                        )
                      }
                    >
                      Konfirmasi Tolak
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons — fixed width so both buttons are identical in size */}
            {!isRejecting && (
              <div className="flex flex-col gap-2 shrink-0 w-24 self-center">
                <Button
                  size="sm"
                  variant="primary"
                  loading={isLoading && loadingAction === "approve"}
                  onClick={() => handleAction(auction.id, "approve")}
                  className="w-full justify-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={isLoading && loadingAction === "reject"}
                  onClick={() => setRejectingId(auction.id)}
                  className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
