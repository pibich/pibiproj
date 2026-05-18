"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatIDR } from "@/lib/utils";
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
  auctionEnded,
  isLoggedIn,
  isSeller,
}: BidFormProps) {
  const t = useTranslations("auction");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bidAmount, setBidAmount] = useState(currentPrice + minIncrement);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const minBid = currentPrice + minIncrement;

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
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
        setMessage({ type: "error", text: data.error ?? t("bidError") });
      } else {
        setMessage({ type: "success", text: t("bidSuccess") });
        router.refresh();
      }
    });
  }

  async function handleBuyNow() {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
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
        setMessage({ type: "error", text: data.error ?? t("bidError") });
      } else {
        setMessage({ type: "success", text: "Selamat! Anda berhasil membeli kartu ini." });
        router.refresh();
      }
    });
  }

  if (auctionEnded) {
    return (
      <div className="rounded-xl bg-gray-100 p-4 text-center text-gray-600 font-medium">
        {t("auctionEnded")}
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
          <label className="text-sm font-medium text-gray-700">
            {t("bidAmount")}
          </label>
          <p className="text-xs text-gray-500">
            Minimum: {formatIDR(minBid)}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={minBid}
              step={minIncrement}
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("bidPlaceholder")}
            />
          </div>
          {/* Quick increment buttons */}
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
          {t("placeBid")} — {formatIDR(bidAmount)}
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
          {t("buyNow")} — {formatIDR(buyNowPrice)}
        </Button>
      )}
    </div>
  );
}
