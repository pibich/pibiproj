import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { formatIDR, formatRelativeTime, getInitials } from "@/lib/utils";
import { AuctionApprovalActions } from "./AuctionApprovalActions";

export type PendingAuctionItem = {
  id: string;
  title: string;
  images: string[];
  starting_price: number;
  current_price: number;
  created_at: string;
  end_time: string | null;
  seller: { username: string; name: string } | null;
  category: { name: string } | null;
};

export function PendingAuctionList({
  auctions,
}: {
  auctions: PendingAuctionItem[];
}) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <ClipboardCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">
          Tidak ada lelang yang menunggu persetujuan
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {auctions.map((a) => (
        <div
          key={a.id}
          className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4"
        >
          {/* Thumbnail */}
          <Link
            href={`/auctions/${a.id}`}
            className="shrink-0 self-center sm:self-start"
          >
            {a.images?.[0] ? (
              // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
              <img
                src={a.images[0]}
                alt={a.title}
                className="w-20 h-20 rounded-lg object-cover border border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100" />
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/auctions/${a.id}`}
              className="font-semibold text-gray-900 hover:text-teal-600 transition-colors line-clamp-1"
            >
              {a.title}
            </Link>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
              {a.category && <span>{a.category.name}</span>}
              <span className="font-medium text-teal-600">
                {formatIDR(a.starting_price)}
              </span>
              <span>diajukan {formatRelativeTime(a.created_at)}</span>
            </div>
            {a.seller && (
              <Link
                href={`/profile/${a.seller.username}`}
                className="flex items-center gap-2 mt-2 w-fit hover:opacity-80 transition-opacity"
              >
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-[10px] font-semibold">
                  {getInitials(a.seller.name)}
                </div>
                <span className="text-xs text-gray-600">
                  {a.seller.name}{" "}
                  <span className="text-gray-400">@{a.seller.username}</span>
                </span>
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="sm:self-center sm:w-56">
            <AuctionApprovalActions auctionId={a.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
