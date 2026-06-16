"use client";

import { Clock, Gavel, ShoppingBag, Star, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryIcon } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";
import { formatIDR, getTimeRemaining } from "@/lib/utils";
import type { Auction, Category, Profile } from "@/types/supabase";

interface AuctionCardProps {
  auction: Auction & {
    seller?: Pick<Profile, "username" | "name">;
    category?: Pick<Category, "name" | "slug">;
    _count?: { bids: number };
    bids?: { count: number }[];
    sellerRating?: number | null;
  };
  /** When true, an active card shows a "Tawar Sekarang" hover affordance (still links to the detail page). */
  enableQuickBid?: boolean;
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

const conditionDot: Record<string, string> = {
  mint: "bg-teal-500",
  near_mint: "bg-teal-500",
  excellent: "bg-amber-500",
  good: "bg-amber-500",
  light_play: "bg-orange-500",
  heavy_play: "bg-orange-500",
  damaged: "bg-red-500",
};

function Countdown({ endTime }: { endTime: string }) {
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(
    null,
  );
  useEffect(() => {
    setTime(getTimeRemaining(endTime));
    const t = setInterval(() => setTime(getTimeRemaining(endTime)), 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (!time) return <span>--:--</span>;
  if (time.expired) return <span>Berakhir</span>;
  const urgent = time.total < 3600;
  return (
    <span className={urgent ? "text-white" : ""}>
      {time.days > 0
        ? `${time.days}h ${String(time.hours).padStart(2, "0")}j`
        : `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`}
    </span>
  );
}

export function AuctionCard({
  auction,
  enableQuickBid = false,
}: AuctionCardProps) {
  const [status, setStatus] = useState<Auction["status"]>(auction.status);
  const [winnerId, setWinnerId] = useState<string | null>(auction.winner_id);
  const [clientExpired, setClientExpired] = useState(() =>
    auction.status === "active" && !!auction.end_time
      ? new Date(auction.end_time) < new Date()
      : false,
  );

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
  const bidCount = auction._count?.bids ?? auction.bids?.[0]?.count ?? 0;
  const quickBid = enableQuickBid && isActive;
  const urgent =
    isActive && auction.end_time
      ? new Date(auction.end_time).getTime() - Date.now() < 3600 * 1000
      : false;

  const inner = (
    <>
      {/* Art */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-teal-50">
        {auction.images[0] ? (
          // biome-ignore lint/performance/noImgElement: Supabase CDN URL
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Gavel className="h-10 w-10 text-slate-300" />
          </div>
        )}

        {/* Countdown / status — top left */}
        <div className="absolute left-2.5 top-2.5">
          {isActive && auction.end_time ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-white shadow-sm ${
                urgent ? "bg-red-500" : "bg-teal-600"
              }`}
            >
              <Clock className="h-3 w-3" />
              <Countdown endTime={auction.end_time} />
            </span>
          ) : (
            <span className="inline-flex rounded-lg bg-slate-700/90 px-2.5 py-1 text-xs font-bold text-white">
              {hasWinner ? "Selesai" : "Gagal"}
            </span>
          )}
        </div>

        {/* Badges — bottom left */}
        <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
          {urgent && isActive && (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Hot
            </span>
          )}
          {auction.buy_now_price && isActive && (
            <span className="inline-flex items-center rounded-md bg-[#28245e] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Beli Langsung
            </span>
          )}
          {auction.free_shipping && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700 backdrop-blur">
              <Truck className="h-3 w-3" />
              Gratis
            </span>
          )}
        </div>

        {/* Hover action */}
        {quickBid && (
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-[13px] font-bold text-white">
              <ShoppingBag className="h-4 w-4" />
              Tawar Sekarang
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {getCategoryIcon(auction.category?.slug ?? "") && (
              // biome-ignore lint/performance/noImgElement: local icon
              <img
                src={getCategoryIcon(auction.category?.slug ?? "") as string}
                alt=""
                className="h-3.5 w-3.5 shrink-0 object-contain"
              />
            )}
            <span className="truncate">{auction.category?.name}</span>
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${conditionDot[auction.condition] ?? "bg-slate-400"}`}
            />
            {conditionLabels[auction.condition] ?? auction.condition}
          </span>
        </div>

        <h3 className="mb-2.5 line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-slate-900 group-hover:text-teal-600">
          {auction.title}
        </h3>

        <div className="mt-auto flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400">Tawaran Tertinggi</p>
            <p className="mt-0.5 font-mono text-base font-bold tracking-tight text-teal-600">
              {formatIDR(auction.current_price)}
            </p>
          </div>
          {auction.buy_now_price && isActive && (
            <div className="min-w-0 sm:text-right">
              <p className="text-[10px] text-slate-400">Beli Langsung</p>
              <p className="mt-0.5 truncate font-mono text-xs font-bold text-amber-600">
                {formatIDR(auction.buy_now_price)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Gavel className="h-3 w-3" />
            {bidCount} tawaran
          </span>
          {auction.seller && (
            <span className="inline-flex items-center gap-1 truncate">
              <span className="truncate text-slate-500">
                @{auction.seller.username}
              </span>
              {auction.sellerRating != null && (
                <>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-600">
                    {auction.sellerRating.toFixed(1)}
                  </span>
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardCls =
    "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg";

  return (
    <Link href={`/auctions/${auction.id}`} className={cardCls}>
      {inner}
    </Link>
  );
}
