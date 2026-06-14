import { MessageSquare } from "lucide-react";
import Link from "next/link";
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
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ulasan Pembeli</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={average} size={18} />
            <span className="text-sm font-semibold text-gray-900">
              {average.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">({count})</span>
          </div>
        )}
      </div>

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
              className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3"
            >
              {/* Avatar */}
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.buyer?.name ?? "Pembeli"}
                    </p>
                    {r.buyer && (
                      <p className="text-xs text-gray-400 truncate">
                        @{r.buyer.username}
                      </p>
                    )}
                  </div>
                  <StarRating value={r.rating} size={14} className="shrink-0" />
                </div>

                {r.comment && (
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                    {r.comment}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2">
                  {r.receipt_photo_url && (
                    <a
                      href={r.receipt_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      {/* biome-ignore lint/performance/noImgElement: Supabase CDN URL */}
                      <img
                        src={r.receipt_photo_url}
                        alt="Bukti penerimaan"
                        className="h-14 w-14 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {r.auction && (
                      <Link
                        href={`/auctions/${r.auction.id}`}
                        className="text-xs text-teal-600 hover:underline truncate"
                      >
                        {r.auction.title}
                      </Link>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(r.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
