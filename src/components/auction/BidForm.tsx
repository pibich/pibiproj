"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatIDR } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Gavel, Zap, AlertCircle, CheckCircle2 } from "lucide-react";

interface BidFormProps {
  auctionId: string;
  currentPrice: number;
  minIncrement: number;
  buyNowPrice: number | null;
  auctionEnded: boolean;
  isLoggedIn: boolean;
  isSeller: boolean;
}

export function BidForm({
  auctionId,
  currentPrice,
  minIncrement,
  buyNowPrice,
  auctionEnded: initialEnded,
  isLoggedIn,
  isSeller,
}: BidFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bidAmount, setBidAmount] = useState(currentPrice + minIncrement);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(initialEnded);

  useEffect(() => {
    setBidAmount(currentPrice + minIncrement);
    setMessage(null);
  }, [currentPrice, minIncrement]);

  useEffect(() => {
    if (auctionEnded) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`auction-status-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const updated = payload.new as { status: string };
          if (updated.status !== "active") {
            setAuctionEnded(true);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, auctionEnded, router]);

  const minBid = currentPrice + minIncrement;

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: bidAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Bid gagal. Pastikan jumlah bid lebih tinggi dari harga saat ini." });
      } else {
        setMessage({ type: "success", text: "Bid berhasil dipasang!" });
        router.refresh();
      }
    });
  }

  async function handleBuyNow() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!buyNowPrice) return;

    startTransition(async () => {
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: buyNowPrice, buyNow: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Bid gagal. Pastikan jumlah bid lebih tinggi dari harga saat ini." });
      } else {
        setAuctionEnded(true);
        setMessage({ type: "success", text: "Selamat! Anda berhasil membeli kartu ini." });
        router.refresh();
      }
    });
  }

  if (auctionEnded) {
    return (
      <div className="rounded-xl bg-gray-100 p-4 text-center text-gray-600 font-medium">
        Lelang Telah Berakhir
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-center text-yellow-700 text-sm">
        Anda adalah penjual lelang ini
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleBid} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Jumlah Bid</label>
          <p className="text-xs text-gray-500">
            Minimum: {formatIDR(minBid)}
          </p>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            min={minBid}
            step={minIncrement}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan jumlah bid"
          />
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 5, 10].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => setBidAmount(currentPrice + minIncrement * mult)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
              >
                +{formatIDR(minIncrement * mult)}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          loading={isPending}
          size="lg"
          className="w-full"
          disabled={bidAmount < minBid}
        >
          <Gavel className="h-4 w-4" />
          Pasang Bid — {formatIDR(bidAmount)}
        </Button>
      </form>

      {buyNowPrice && (
        <Button
          variant="outline"
          size="lg"
          className="w-full border-green-500 text-green-600 hover:bg-green-50"
          onClick={handleBuyNow}
          loading={isPending}
        >
          <Zap className="h-4 w-4" />
          Beli Langsung — {formatIDR(buyNowPrice)}
        </Button>
      )}
    </div>
  );
}
