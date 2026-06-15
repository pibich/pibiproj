"use client";

import { Clock, Gavel, ShoppingBag, Star, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryIcon } from "@/lib/categories";
import { formatIDR, getTimeRemaining } from "@/lib/utils";
import type { Auction, Category, Profile } from "@/types/supabase";

export type FeaturedAuction = Auction & {
  seller?: Pick<Profile, "username" | "name">;
  category?: Pick<Category, "name" | "slug">;
  bidCount?: number;
};

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

function Countdown({ endTime }: { endTime: string }) {
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(
    null,
  );

  useEffect(() => {
    setTime(getTimeRemaining(endTime));
    const interval = setInterval(
      () => setTime(getTimeRemaining(endTime)),
      1000,
    );
    return () => clearInterval(interval);
  }, [endTime]);

  if (!time) {
    return <span className="font-mono">--:--</span>;
  }
  if (time.expired) {
    return <span className="font-mono">Berakhir</span>;
  }
  return (
    <span className="font-mono tabular-nums">
      {time.days > 0
        ? `${time.days}h ${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`
        : `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`}
    </span>
  );
}

export function FeaturedLot({ auction }: { auction: FeaturedAuction }) {
  const icon = auction.category ? getCategoryIcon(auction.category.slug) : null;

  return (
    <div className="relative">
      {/* Floating tag */}
      <div className="absolute -top-3 left-5 z-10 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
        </span>
        Lelang Sorotan · Live
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-300/30">
        {/* Art */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-teal-50">
          {auction.images[0] ? (
            // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gavel className="h-12 w-12 text-slate-300" />
            </div>
          )}

          {/* Countdown chip */}
          {auction.end_time && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Clock className="h-3.5 w-3.5" />
              <Countdown endTime={auction.end_time} />
            </div>
          )}

          {/* Bottom badges */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {auction.free_shipping && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700 backdrop-blur">
                <Truck className="h-3 w-3" />
                Gratis Ongkir
              </span>
            )}
            {auction.buy_now_price && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#28245e] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Beli {formatIDR(auction.buy_now_price)}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-1.5 pb-1 pt-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {icon && (
              // biome-ignore lint/performance/noImgElement: small local category icon
              <img src={icon} alt="" className="h-4 w-4 object-contain" />
            )}
            {auction.category && <span>{auction.category.name}</span>}
            <span className="text-slate-300">·</span>
            <span>
              {conditionLabels[auction.condition] ?? auction.condition}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-slate-900">
            {auction.title}
          </h3>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Tawaran tertinggi</p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-slate-900">
                {formatIDR(auction.current_price)}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Gavel className="h-3 w-3" />
                  {auction.bidCount ?? 0} tawaran
                </span>
                {auction.seller && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="truncate">@{auction.seller.username}</span>
                  </>
                )}
              </p>
            </div>

            <Link
              href={`/auctions/${auction.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700"
            >
              <ShoppingBag className="h-4 w-4" />
              Tawar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
