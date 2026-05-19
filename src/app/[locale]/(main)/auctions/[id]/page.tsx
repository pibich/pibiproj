import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { BidForm } from "@/components/auction/BidForm";
import { ConfirmTransactionButton } from "@/components/auction/ConfirmTransactionButton";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate, getInitials } from "@/lib/utils";
import {
  Gavel,
  Eye,
  MessageSquare,
  Flag,
  Calendar,
  ChevronLeft,
  AlertTriangle,
  TrendingUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import type { Auction, Category, Profile, Bid } from "@/types/supabase";

type BidWithBidder = Bid & {
  bidder: Pick<Profile, "username" | "name" | "buyer_warning_count"> | null;
};
type FullAuction = Auction & {
  seller: Pick<Profile, "id" | "username" | "name" | "avatar_url">;
  winner: Pick<Profile, "id" | "username" | "name"> | null;
  category: Pick<Category, "name" | "slug">;
  bids: BidWithBidder[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("auctions").select("title").eq("id", id).single();
  return { title: (data as { title: string } | null)?.title ?? "Lelang" };
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("auction");
  const supabase = await createClient();
  const currentUser = await getUser();

  const { data: auctionRaw, error: auctionError } = await (supabase
    .from("auctions")
    .select(
      `*,
      seller:profiles!seller_id(id, username, name, avatar_url),
      winner:profiles!winner_id(id, username, name),
      category:categories(name, slug),
      bids(*, bidder:profiles!bidder_id(username, name, buyer_warning_count))`
    )
    .eq("id", id)
    .single() as unknown as Promise<{ data: FullAuction | null; error: object | null }>);

  if (auctionError || !auctionRaw) notFound();

  const auction = auctionRaw;

  // Seller success rate
  const { data: sellerStats } = await supabase
    .from("auctions")
    .select("status")
    .eq("seller_id", auction.seller.id)
    .neq("status", "cancelled");

  const totalSellerAuctions = sellerStats?.length ?? 0;
  const completedSellerAuctions = sellerStats?.filter((a) => a.status === "completed").length ?? 0;
  const sellerSuccessRate =
    totalSellerAuctions > 0
      ? Math.round((completedSellerAuctions / totalSellerAuctions) * 100)
      : null;

  // Increment view count (fire and forget)
  supabase
    .from("auctions")
    .update({ view_count: (auction.view_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  const isEnded =
    auction.status !== "active" ||
    (auction.end_time ? new Date(auction.end_time) < new Date() : false);

  const isSeller = currentUser?.id === auction.seller.id;

  const sortedBids = [...auction.bids].sort(
    (a, b) => Number(b.amount) - Number(a.amount)
  );

  const conditionColors: Record<string, "success" | "info" | "warning" | "danger" | "default"> = {
    mint: "success", near_mint: "success", excellent: "info", good: "info",
    light_play: "warning", heavy_play: "warning", damaged: "danger",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href={`/${locale}/auctions`} className="hover:text-gray-700 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{auction.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Images + Description */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main image */}
          <div className="aspect-square sm:aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
            {auction.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={auction.images[0]}
                alt={auction.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gavel className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {auction.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {auction.images.map((img: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt={`${auction.title} ${i + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 cursor-pointer shrink-0"
                />
              ))}
            </div>
          )}

          {/* Info chips */}
          <div className="flex gap-2 flex-wrap">
            {auction.category && (
              <Badge variant="info">{auction.category.name}</Badge>
            )}
            <Badge variant={conditionColors[auction.condition] ?? "default"}>
              {t(`conditions.${auction.condition}`)}
            </Badge>
            <Badge
              variant={
                auction.status === "active" ? "success"
                : auction.status === "completed" ? "info"
                : "default"
              }
            >
              {t(`status.${auction.status}`)}
            </Badge>
          </div>

          {/* Title & Description */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{auction.title}</h1>
            {auction.description && (
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {auction.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {auction.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <Gavel className="h-4 w-4" />
              {sortedBids.length} bids
            </span>
            {auction.start_time && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(auction.start_time, locale)}
              </span>
            )}
          </div>
        </div>

        {/* Right — Bid panel */}
        <div className="flex flex-col gap-4">
          {/* Price card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500">{t("currentPrice")}</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatIDR(auction.current_price)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Mulai: {formatIDR(auction.starting_price)}
              </p>
            </div>

            {auction.end_time && !isEnded && (
              <CountdownTimer endTime={auction.end_time} />
            )}

            <BidForm
              auctionId={auction.id}
              currentPrice={auction.current_price}
              minIncrement={auction.min_bid_increment}
              buyNowPrice={auction.buy_now_price}
              auctionEnded={isEnded}
              isLoggedIn={!!currentUser}
              isSeller={isSeller}
            />

            {/* Chat & Report */}
            {currentUser && !isSeller && (
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Link
                  href={`/${locale}/chat?seller=${auction.seller.id}&auction=${auction.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t("chatWithSeller")}
                </Link>
                <Link
                  href={`/${locale}/profile/${auction.seller.username}?report=true`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Seller card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("seller")}
            </p>
            <Link
              href={`/${locale}/profile/${auction.seller.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {auction.seller.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={auction.seller.avatar_url}
                    alt={auction.seller.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getInitials(auction.seller.name)
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{auction.seller.name}</p>
                <p className="text-xs text-gray-500">@{auction.seller.username}</p>
              </div>
            </Link>
            {/* Seller success rate */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {sellerSuccessRate !== null ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className={`h-3.5 w-3.5 ${sellerSuccessRate >= 60 ? "text-green-500" : "text-yellow-500"}`} />
                  <span className={`font-medium ${sellerSuccessRate >= 60 ? "text-green-700" : "text-yellow-700"}`}>
                    {sellerSuccessRate}% keberhasilan
                  </span>
                  <span className="text-gray-400">
                    ({completedSellerAuctions}/{totalSellerAuctions} lelang)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Info className="h-3.5 w-3.5" />
                  Belum ada riwayat lelang
                </div>
              )}
            </div>
          </div>

          {/* Transaction confirmation (seller only, when auction ended with winner) */}
          {isSeller &&
            (auction.status === "completed" || auction.status === "closed") &&
            auction.winner_id && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Konfirmasi Transaksi
                </p>
                {auction.winner && (
                  <p className="text-sm text-gray-600">
                    Pemenang: <span className="font-semibold">@{auction.winner.username}</span>
                  </p>
                )}
                {auction.transaction_confirmed ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Transaksi telah dikonfirmasi
                  </div>
                ) : (
                  <ConfirmTransactionButton
                    auctionId={auction.id}
                    winnerUsername={auction.winner?.username ?? "pembeli"}
                  />
                )}
              </div>
            )}

          {/* Transaction confirmed badge (visible to buyer) */}
          {!isSeller &&
            auction.transaction_confirmed &&
            auction.winner_id === currentUser?.id && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Transaksi telah dikonfirmasi oleh penjual. Rating Anda telah diperbarui!
              </div>
            )}

          {/* Bid history */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("bidHistory")}
            </p>
            {sortedBids.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">{t("noBids")}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {sortedBids.map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between text-sm ${
                      i === 0 ? "text-blue-600 font-semibold" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span>@{bid.bidder?.username ?? "unknown"}</span>
                      {(bid.bidder?.buyer_warning_count ?? 0) > 0 && (
                        <span
                          title={`Pembeli ini memiliki ${bid.bidder?.buyer_warning_count}x peringatan`}
                          className="flex items-center gap-0.5 text-orange-500"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">{bid.bidder?.buyer_warning_count}</span>
                        </span>
                      )}
                    </div>
                    <span>{formatIDR(bid.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
