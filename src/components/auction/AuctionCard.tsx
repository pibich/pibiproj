"use client";

import Link from "next/link";
import { Clock, Eye, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, getTimeRemaining } from "@/lib/utils";
import type { Auction, Profile, Category } from "@/types/supabase";
import { useEffect, useState } from "react";

interface AuctionCardProps {
  auction: Auction & {
    seller?: Pick<Profile, "username" | "name">;
    category?: Pick<Category, "name" | "slug">;
    _count?: { bids: number };
  };
}

const conditionLabels: Record<string, string> = {
  mint: "Mint", near_mint: "Near Mint", excellent: "Excellent", good: "Good",
  light_play: "Light Play", heavy_play: "Heavy Play", damaged: "Damaged",
};

const statusLabels: Record<string, string> = {
  draft: "Draft", active: "Aktif", closed: "Selesai",
  completed: "Terkonfirmasi", cancelled: "Dibatalkan",
};

const conditionColors: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
  mint: "success", near_mint: "success", excellent: "info", good: "info",
  light_play: "warning", heavy_play: "warning", damaged: "danger",
};

function CountdownBadge({ endTime }: { endTime: string }) {
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    setTime(getTimeRemaining(endTime));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!time) return null;

  if (time.expired) {
    return <Badge variant="danger">Selesai</Badge>;
  }

  const isUrgent = time.total < 3600;

  return (
    <Badge variant={isUrgent ? "danger" : "warning"} className="font-mono text-xs shadow-sm">
      <Clock className="h-3 w-3 mr-1" />
      {time.days > 0
        ? `${time.days}h ${time.hours}j`
        : `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`}
    </Badge>
  );
}

export function AuctionCard({ auction }: AuctionCardProps) {
  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group block bg-white rounded-xl border border-sky-100 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/60 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
        {auction.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="h-12 w-12 text-sky-200" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {auction.status === "active" && auction.end_time && (
            <CountdownBadge endTime={auction.end_time} />
          )}
          {auction.status !== "active" && (
            <Badge
              variant={auction.status === "completed" ? "success" : auction.status === "cancelled" ? "danger" : "default"}
            >
              {statusLabels[auction.status] ?? auction.status}
            </Badge>
          )}
        </div>

        {auction.buy_now_price && auction.status === "active" && (
          <div className="absolute top-2 right-2">
            <Badge variant="info" className="shadow-sm">Buy Now</Badge>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {auction.category && (
            <span className="text-xs text-sky-500 font-medium">{auction.category.name}</span>
          )}
          <span className="text-sky-200">·</span>
          <Badge variant={conditionColors[auction.condition] ?? "default"} className="text-xs">
            {conditionLabels[auction.condition] ?? auction.condition}
          </Badge>
        </div>

        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-sky-600 transition-colors duration-200">
          {auction.title}
        </h3>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400">Harga Saat Ini</p>
            <p className="text-base font-bold text-sky-600">
              {formatIDR(auction.current_price)}
            </p>
          </div>
          {auction.buy_now_price && auction.status === "active" && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Buy Now</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatIDR(auction.buy_now_price)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-sky-50">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Gavel className="h-3 w-3" />
              {auction._count?.bids ?? 0} bid
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {auction.view_count}
            </span>
          </div>
          {auction.seller && (
            <span className="text-xs text-slate-400 truncate max-w-[80px]">
              @{auction.seller.username}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
