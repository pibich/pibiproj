"use client";

import { Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FailWinnerButtonProps {
  auctionId: string;
  winnerUsername: string;
}

export function FailWinnerButton({
  auctionId,
  winnerUsername,
}: FailWinnerButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/fail-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menggagalkan lelang");
        return;
      }
      setShowDialog(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        <XCircle className="h-4 w-4" />
        Buyer tidak bayar — Gagalkan lelang
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setShowDialog(false)}
          />
          <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gagalkan Lelang</h3>
                <p className="text-sm text-gray-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              Laporkan bahwa{" "}
              <span className="font-semibold">@{winnerUsername}</span> tidak
              menyelesaikan pembayaran. Lelang akan ditandai{" "}
              <span className="font-semibold">Gagal</span> dan laporan dikirim
              ke tim moderasi.
            </p>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan tambahan (opsional) — mis. tidak merespons chat sejak menang."
              rows={3}
              className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-200 py-2 px-4 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFail}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  "Ya, Gagalkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
