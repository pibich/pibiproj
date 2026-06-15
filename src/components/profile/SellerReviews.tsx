"use client";

import { MessageSquare, X, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { formatRelativeTime, getInitials } from "@/lib/utils";

export interface SellerReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  receipt_photo_url: string | null;
  created_at: string;
  buyer: { username: string; name: string; avatar_url: string | null } | null;
  auction: { id: string; title: string } | null;
}

interface SellerReviewsProps {
  reviews: SellerReviewItem[];
  average: number;
  count: number;
}

export function SellerReviews({ reviews, average, count }: SellerReviewsProps) {
  // Receipt photo currently open in the lightbox (null = closed).
  const [receiptLightbox, setReceiptLightbox] = useState<string | null>(null);

  // Star distribution (index 1..5)
  const dist = [0, 0, 0, 0, 0, 0];
  for (const r of reviews) {
    const k = Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[k] += 1;
  }

  return (
    <section>
      {count > 0 && (
        <div className="mb-5 flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center sm:w-44">
            <p className="text-5xl font-bold text-slate-900">
              {average.toFixed(1)}
            </p>
            <StarRating value={average} size={16} className="mt-1.5" />
            <p className="mt-1 text-xs text-gray-400">{count} ulasan</p>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct =
                count > 0 ? Math.round((dist[star] / count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 shrink-0 text-slate-500">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-slate-400">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {count === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <MessageSquare className="h-9 w-9 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            Belum ada ulasan dari pembeli.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="relative bg-white rounded-2xl border border-gray-200 p-5 transition-all hover:border-teal-300 hover:shadow-sm"
            >
              {/* Stretched link — makes the whole card navigate to the post,
                  while interactive children (receipt button) sit above it. */}
              {r.auction && (
                <Link
                  href={`/auctions/${r.auction.id}`}
                  aria-label={`Lihat post ${r.auction.title}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                />
              )}

              {/* Header: buyer + time + rating */}
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {r.buyer?.avatar_url ? (
                    // biome-ignore lint/performance/noImgElement: Supabase CDN URL
                    <img
                      src={r.buyer.avatar_url}
                      alt={r.buyer.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-teal-600 flex items-center justify-center text-xs font-semibold">
                      {r.buyer ? getInitials(r.buyer.name) : "?"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {r.buyer?.name ?? "Pembeli"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(r.created_at)}
                  </p>
                </div>

                <StarRating value={r.rating} size={14} className="shrink-0" />
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                  {r.comment}
                </p>
              )}

              {/* Purchase post */}
              {r.auction && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                  {r.receipt_photo_url ? (
                    <button
                      type="button"
                      onClick={() => setReceiptLightbox(r.receipt_photo_url)}
                      title="Lihat bukti penerimaan"
                      className="group relative z-10 h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-transparent transition hover:ring-teal-400"
                    >
                      {/* biome-ignore lint/performance/noImgElement: Supabase CDN URL */}
                      <img
                        src={r.receipt_photo_url}
                        alt="Bukti penerimaan"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">
                        <ZoomIn className="h-4 w-4" />
                      </span>
                      <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 px-1 py-px text-center text-[8px] font-bold uppercase tracking-wide text-white">
                        Bukti
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Postingan Pembelian
                    </p>
                    <p className="truncate text-sm font-medium text-slate-900">
                      {r.auction.title}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-medium text-teal-600">
                    Lihat post →
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Receipt photo lightbox */}
      {receiptLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setReceiptLightbox(null)}
          />
          <div className="relative flex max-h-[85vh] max-w-lg flex-col">
            <button
              type="button"
              onClick={() => setReceiptLightbox(null)}
              className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="mb-2 text-xs font-bold uppercase tracking-wide text-white/80">
              Bukti Penerimaan
            </span>
            {/* biome-ignore lint/performance/noImgElement: Supabase CDN URL */}
            <img
              src={receiptLightbox}
              alt="Bukti penerimaan"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
