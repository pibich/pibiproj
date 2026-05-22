"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmTransactionButtonProps {
  auctionId: string;
  winnerUsername: string;
}

export function ConfirmTransactionButton({
  auctionId,
  winnerUsername,
}: ConfirmTransactionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/auctions/${auctionId}/confirm-transaction`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengkonfirmasi transaksi");
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
      <Button
        onClick={() => setShowDialog(true)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Konfirmasi Transaksi
      </Button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setShowDialog(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Konfirmasi Transaksi
                </h3>
                <p className="text-sm text-gray-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              Konfirmasikan bahwa{" "}
              <span className="font-semibold">@{winnerUsername}</span> telah
              menyelesaikan pembayaran untuk lelang ini?
            </p>

            <p className="text-xs text-gray-400">
              Setelah dikonfirmasi, rating keberhasilan transaksi akan diberikan
              kepada pembeli dan penjual.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDialog(false)}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  "Ya, Konfirmasi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
