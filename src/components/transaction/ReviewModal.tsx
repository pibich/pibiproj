"use client";

import { Send, Star, X } from "lucide-react";
import { useState } from "react";

interface ReviewModalProps {
  transactionId: string;
  auctionTitle: string;
  /** Buyer's receipt photo, reused from the transaction (shown read-only). */
  receiptPhotoUrl?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STARS = [1, 2, 3, 4, 5];

export function ReviewModal({
  transactionId,
  auctionTitle,
  receiptPhotoUrl,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) {
      setError("Pilih rating bintang terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal mengirim ulasan");
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Star className="h-[18px] w-[18px] text-white fill-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">
                Beri Ulasan Penjual
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {auctionTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 border-t border-gray-100" />

        <div className="p-5 flex flex-col gap-4">
          {/* Star picker */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1">
              {STARS.map((n) => {
                const active = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} bintang`}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={
                        active
                          ? "h-8 w-8 text-amber-400 fill-amber-400"
                          : "h-8 w-8 text-gray-300"
                      }
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-gray-400 h-4">
              {rating > 0 ? `${rating} dari 5` : "Ketuk bintang untuk menilai"}
            </span>
          </div>

          {/* Receipt photo reused from the transaction */}
          {receiptPhotoUrl && (
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Foto bukti penerimaan
              </span>
              {/* biome-ignore lint/performance/noImgElement: Supabase CDN URL */}
              <img
                src={receiptPhotoUrl}
                alt="Bukti penerimaan"
                className="w-full max-h-40 object-contain rounded-xl border border-gray-100 bg-gray-50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Foto ini akan ditampilkan bersama ulasan Anda.
              </p>
            </div>
          )}

          {/* Comment */}
          <div>
            <label
              htmlFor="review-comment"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"
            >
              Ulasan{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Misal: barang sesuai deskripsi, penjual responsif"
              rows={3}
              maxLength={1000}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || rating < 1}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </div>
    </div>
  );
}
