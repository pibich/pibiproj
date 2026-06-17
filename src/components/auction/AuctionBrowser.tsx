"use client";

import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle2,
  Clock,
  Gavel,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Auction, Category, Profile } from "@/types/supabase";
import { AuctionCard } from "./AuctionCard";

type AuctionWithRelations = Auction & {
  seller?: Pick<Profile, "username" | "name">;
  category?: Pick<Category, "name" | "slug">;
  _count?: { bids: number };
  bids?: { count: number }[];
  sellerRating?: number | null;
};

interface AuctionBrowserProps {
  auctions: AuctionWithRelations[];
  totalActive: number;
}

const quickChips = [
  { key: "all", label: "Semua", icon: null },
  { key: "ending", label: "Berakhir Segera", icon: Clock },
  { key: "buy", label: "Beli Langsung", icon: ShoppingBag },
  { key: "free", label: "Gratis Ongkir", icon: Truck },
  { key: "selesai", label: "Selesai", icon: CheckCircle2 },
] as const;

export function AuctionBrowser({ auctions, totalActive }: AuctionBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [stuck, setStuck] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const isEnded = searchParams.get("status") === "ended";

  // Toggle the "stuck" treatment (shadow + opaque bg) once the bar pins under
  // the navbar (h-16 = 64px).
  useEffect(() => {
    function onScroll() {
      const el = barRef.current;
      if (!el) return;
      setStuck(el.getBoundingClientRect().top <= 65);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  let activeChip = "all";
  if (isEnded) activeChip = "selesai";
  else if (searchParams.get("buy") === "1") activeChip = "buy";
  else if (searchParams.get("free") === "1") activeChip = "free";
  else if (searchParams.get("sort") === "ending_soon") activeChip = "ending";

  const sortValue =
    searchParams.get("sort") ?? (isEnded ? "recently_ended" : "ending_soon");
  // The toolbar exposes a single asc/desc axis on price:
  // asc = cheapest first (price_low), desc = most expensive first (price_high).
  const priceAsc = sortValue === "price_low";
  const priceDesc = sortValue === "price_high";

  /** Fresh params that keep the rail/search context (category, q). */
  function baseParams() {
    const p = new URLSearchParams();
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    return p;
  }

  function push(p: URLSearchParams) {
    const qs = p.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    });
  }

  function applyQuick(key: string) {
    const p = baseParams();
    switch (key) {
      case "ending":
        p.set("sort", "ending_soon");
        break;
      case "buy":
        p.set("buy", "1");
        break;
      case "free":
        p.set("free", "1");
        break;
      case "selesai":
        p.set("status", "ended");
        break;
      default:
        break; // "all" → only category/q
    }
    push(p);
  }

  function applySort(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("sort", value);
    push(p);
  }

  return (
    <>
      {/* Sticky toolbar — full-bleed, content constrained */}
      <div
        ref={barRef}
        className={[
          "sticky top-16 z-30 transition-shadow",
          stuck
            ? "border-b border-slate-200 bg-[#eef2f7]/92 backdrop-blur-md shadow-sm"
            : "border-b border-transparent",
        ].join(" ")}
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <span className="shrink-0 text-sm font-bold text-slate-900">
            {auctions.length} lelang{" "}
            <span className="font-medium text-slate-400">/ {totalActive}</span>
          </span>

          {/* Quick filter chips */}
          <div className="flex flex-1 gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickChips.map(({ key, label, icon: Icon }) => {
              const active = activeChip === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyQuick(key)}
                  className={[
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                    active
                      ? key === "selesai"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  ].join(" ")}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sort direction (price asc/desc) */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="text-xs text-slate-400">Harga</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => applySort("price_low")}
                aria-label="Harga termurah dulu"
                aria-pressed={priceAsc}
                className={`inline-flex h-9 items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors ${
                  priceAsc
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                <ArrowUpNarrowWide className="h-4 w-4" />
                Termurah
              </button>
              <button
                type="button"
                onClick={() => applySort("price_high")}
                aria-label="Harga termahal dulu"
                aria-pressed={priceDesc}
                className={`inline-flex h-9 items-center gap-1.5 border-l border-slate-200 px-3 text-[13px] font-semibold transition-colors ${
                  priceDesc
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                <ArrowDownWideNarrow className="h-4 w-4" />
                Termahal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {auctions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <Gavel className="h-11 w-11 text-slate-300" />
            <p className="font-medium text-slate-500">
              {isEnded
                ? "Belum ada lelang yang selesai"
                : "Belum ada lelang yang cocok"}
            </p>
            <p className="text-sm text-slate-400">
              Coba ubah filter atau kembali lagi nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} enableQuickBid />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
