"use client";

import { Clock, Eye, Gavel, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { getCategoryIcon } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { formatIDR, getTimeRemaining } from "@/lib/utils";
import type { Auction, Category, Profile } from "@/types/supabase";

interface AuctionCardProps {
  auction: Auction & {
    seller?: Pick<Profile, "username" | "name">;
    category?: Pick<Category, "name" | "slug">;
    _count?: { bids: number };
  };
}

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

const conditionColors: Record<
  string,
  "success" | "info" | "warning" | "danger" | "default"
> = {
  mint: "success",
  near_mint: "success",
  excellent: "info",
  good: "info",
  light_play: "warning",
  heavy_play: "warning",
  damaged: "danger",
};

function getStatusLabel(
  status: Auction["status"],
  winnerId: string | null,
): string {
  if (status === "closed") return winnerId ? "Selesai" : "Gagal";
  if (status === "completed") return "Terkonfirmasi";
  if (status === "cancelled") return "Dibatalkan";
  if (status === "active") return "Aktif";
  return status;
}

function getStatusVariant(
  status: Auction["status"],
  winnerId: string | null,
): "success" | "danger" | "warning" | "default" {
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  if (status === "closed") return winnerId ? "default" : "danger";
  return "default";
}

function CountdownBadge({
  endTime,
  hasWinner,
}: {
  endTime: string;
  hasWinner: boolean;
}) {
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(
    null,
  );

  useEffect(() => {
    setTime(getTimeRemaining(endTime));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (time?.expired) {
    return <Badge variant="danger">{hasWinner ? "Selesai" : "Gagal"}</Badge>;
  }

  if (!time) return null;

  const isUrgent = time.total < 3600;

  return (
    <Badge
      variant={isUrgent ? "danger" : "warning"}
      className="font-mono text-xs shadow-sm"
    >
      <Clock className="h-3 w-3 mr-1" />
      {time.days > 0
        ? `${time.days}h ${time.hours}j`
        : `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`}
    </Badge>
  );
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [status, setStatus] = useState<Auction["status"]>(auction.status);
  const [winnerId, setWinnerId] = useState<string | null>(auction.winner_id);
  // Client-side expiry: hides Buy Now as soon as the timer runs out, even if
  // the DB hasn't been updated yet (lazy close runs on next page load)
  const [clientExpired, setClientExpired] = useState(() =>
    auction.status === "active" && !!auction.end_time
      ? new Date(auction.end_time) < new Date()
      : false,
  );

  // Schedule expiry exactly when end_time hits (no polling)
  useEffect(() => {
    if (status !== "active" || !auction.end_time) return;
    const diff = new Date(auction.end_time).getTime() - Date.now();
    if (diff <= 0) {
      setClientExpired(true);
      return;
    }
    const t = setTimeout(() => setClientExpired(true), diff);
    return () => clearTimeout(t);
  }, [status, auction.end_time]);

  // Realtime: sync status changes from DB (buy-now, admin close, etc.)
  useEffect(() => {
    if (status !== "active") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`auction-card-${auction.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auction.id}`,
        },
        (payload) => {
          const updated = payload.new as {
            status: Auction["status"];
            winner_id: string | null;
          };
          if (updated.status !== "active") {
            setStatus(updated.status);
            setWinnerId(updated.winner_id);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auction.id, status]);

  const isActive = status === "active" && !clientExpired;
  const hasWinner = !!winnerId;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group block bg-white rounded-xl border border-sky-100 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/60 transition-all duration-300 overflow-hidden hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-50 to-blue-50 overflow-hidden">
        {auction.images[0] ? (
          // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
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

        {/* Status / countdown badge — top left */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isActive && auction.end_time ? (
            <CountdownBadge endTime={auction.end_time} hasWinner={hasWinner} />
          ) : (
            <Badge variant={getStatusVariant(status, winnerId)}>
              {getStatusLabel(status, winnerId)}
            </Badge>
          )}
        </div>

        {/* Buy Now badge — top right, only while truly active */}
        {auction.buy_now_price && isActive && (
          <div className="absolute top-2 right-2">
            <Badge variant="info" className="shadow-sm">
              Buy Now
            </Badge>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Category + condition */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {auction.category && (
            <span className="flex items-center gap-1 text-xs text-sky-500 font-medium">
              {getCategoryIcon(auction.category.slug) && (
                // biome-ignore lint/performance/noImgElement: small local category icon
                <img
                  src={getCategoryIcon(auction.category.slug) as string}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0"
                />
              )}
              {auction.category.name}
            </span>
          )}
          <span className="text-sky-200">·</span>
          <Badge
            variant={conditionColors[auction.condition] ?? "default"}
            className="text-xs"
          >
            {conditionLabels[auction.condition] ?? auction.condition}
          </Badge>
          {auction.free_shipping && (
            <Badge variant="success" className="text-xs">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Gratis Ongkir
              </span>
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-sky-600 transition-colors duration-200">
          {auction.title}
        </h3>

        {/* Prices */}
        {auction.buy_now_price && isActive ? (
          <div className="grid grid-cols-2 gap-2 mb-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 leading-tight">
                Harga Saat Ini
              </p>
              <p className="text-xs font-bold text-sky-600 truncate leading-tight">
                {formatIDR(auction.current_price)}
              </p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] text-slate-400 leading-tight">
                Buy Now
              </p>
              <p className="text-xs font-semibold text-emerald-600 truncate leading-tight">
                {formatIDR(auction.buy_now_price)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-0">
            <p className="text-[10px] text-slate-400 leading-tight">
              {status === "completed" ? "Harga Final" : "Harga Saat Ini"}
            </p>
            <p className="text-sm font-bold text-sky-600 leading-tight">
              {formatIDR(auction.current_price)}
            </p>
          </div>
        )}

        {/* Footer: bids + views + seller */}
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
