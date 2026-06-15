"use client";

import { AlertCircle, CheckCircle2, Clock, Gavel, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatIDR, getTimeRemaining } from "@/lib/utils";

interface BidPanelProps {
  auctionId: string;
  currentPrice: number;
  minIncrement: number;
  buyNowPrice: number | null;
  endTime: string | null;
  bidCount: number;
  auctionEnded: boolean;
  isLoggedIn: boolean;
  isSeller: boolean;
}

function CountdownBadge({
  endTime,
  ended,
}: {
  endTime: string;
  ended: boolean;
}) {
  const [time, setTime] = useState<ReturnType<typeof getTimeRemaining> | null>(
    null,
  );

  useEffect(() => {
    setTime(getTimeRemaining(endTime));
    const t = setInterval(() => setTime(getTimeRemaining(endTime)), 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (ended || time?.expired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 font-mono text-sm font-bold text-slate-600">
        <Clock className="h-3.5 w-3.5" />
        Berakhir
      </span>
    );
  }
  if (!time) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 font-mono text-sm font-bold text-white">
        <Clock className="h-3.5 w-3.5" />
        --:--
      </span>
    );
  }

  const urgent = time.total < 3600;
  const label =
    time.days > 0
      ? `${time.days}h ${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`
      : time.hours > 0
        ? `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`
        : `${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-white tabular-nums ${
        urgent ? "bg-red-500" : "bg-teal-600"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function BidPanel({
  auctionId,
  currentPrice: initialPrice,
  minIncrement,
  buyNowPrice,
  endTime,
  bidCount: initialBidCount,
  auctionEnded: initialEnded,
  isLoggedIn,
  isSeller,
}: BidPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [bidCount, setBidCount] = useState(initialBidCount);
  const [bidAmount, setBidAmount] = useState(initialPrice + minIncrement);
  const [auctionEnded, setAuctionEnded] = useState(initialEnded);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "login";
    text: string;
  } | null>(null);

  const minBid = currentPrice + minIncrement;

  useEffect(() => {
    setCurrentPrice(initialPrice);
    setBidAmount(initialPrice + minIncrement);
  }, [initialPrice, minIncrement]);

  useEffect(() => {
    if (auctionEnded) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`auction-panel-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const updated = payload.new as {
            status: string;
            current_price: number;
          };
          if (typeof updated.current_price === "number") {
            setCurrentPrice(updated.current_price);
          }
          if (updated.status !== "active") {
            setAuctionEnded(true);
            router.refresh();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, auctionEnded, router]);

  function placeBid(amount: number, buyNow = false) {
    if (!isLoggedIn) {
      setMessage({
        type: "login",
        text: "Silakan login terlebih dahulu untuk menawar.",
      });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buyNow ? { amount, buyNow: true } : { amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: res.status === 401 ? "login" : "error",
          text: data.error ?? "Tawaran gagal. Coba jumlah yang lebih tinggi.",
        });
      } else {
        if (buyNow) setAuctionEnded(true);
        setCurrentPrice(amount);
        setBidAmount(amount + minIncrement);
        setBidCount((c) => c + 1);
        setMessage({
          type: "success",
          text: buyNow
            ? "Selamat! Anda berhasil membeli kartu ini."
            : "Tawaran berhasil dipasang!",
        });
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Price + countdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Tawaran tertinggi</p>
          <p className="mt-0.5 font-mono text-3xl font-bold tracking-tight text-slate-900">
            {formatIDR(currentPrice)}
          </p>
        </div>
        {endTime && <CountdownBadge endTime={endTime} ended={auctionEnded} />}
      </div>

      {/* Bid input row */}
      <div className="mt-4">
        {auctionEnded ? (
          <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
            Lelang Telah Berakhir
          </div>
        ) : isSeller ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
            Anda adalah penjual lelang ini
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border border-slate-200 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                <span className="font-mono text-sm font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={bidAmount}
                  min={minBid}
                  step={minIncrement}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full bg-transparent px-2 py-3 font-mono text-base font-bold text-slate-900 outline-none"
                />
              </div>
              <button
                type="button"
                disabled={isPending || bidAmount < minBid}
                onClick={() => placeBid(bidAmount)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                <Gavel className="h-4 w-4" />
                Tawar
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Tawaran minimum berikutnya:{" "}
                <span className="font-mono font-semibold text-slate-900">
                  {formatIDR(minBid)}
                </span>{" "}
                · {bidCount} tawaran masuk
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 5].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setBidAmount(currentPrice + minIncrement * m)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 font-mono text-[11px] font-semibold text-slate-600 hover:border-slate-400"
                  >
                    +{formatIDR(minIncrement * m)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {message && (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : message.type === "login"
                ? "bg-teal-50 text-teal-700"
                : "bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : message.type === "login" ? (
            <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            {message.text}{" "}
            {message.type === "login" && (
              <Link href="/login" className="font-semibold underline">
                Login sekarang
              </Link>
            )}
          </span>
        </div>
      )}

      {/* Buy now */}
      {buyNowPrice && !auctionEnded && !isSeller && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Beli langsung sekarang</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
              {formatIDR(buyNowPrice)}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => placeBid(buyNowPrice, true)}
              className="inline-flex shrink-0 items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              Beli
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
