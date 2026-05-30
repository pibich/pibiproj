export const dynamic = "force-dynamic";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Eye,
  Flag,
  Gavel,
  Info,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Truck,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionApprovalActions } from "@/components/admin/AuctionApprovalActions";
import { BidForm } from "@/components/auction/BidForm";
import { ConfirmTransactionButton } from "@/components/auction/ConfirmTransactionButton";
import { CountdownTimer } from "@/components/auction/CountdownTimer";
import { ImageGallery } from "@/components/auction/ImageGallery";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationCountdown } from "@/components/ui/ConfirmationCountdown";
import { getCategoryIcon } from "@/lib/categories";
import { getUser } from "@/lib/dal";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatIDR, getInitials } from "@/lib/utils";
import type {
  Auction,
  Bid,
  Category,
  Database,
  Profile,
} from "@/types/supabase";

const conditionLabels: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  light_play: "Light Play",
  heavy_play: "Heavy Play",
  damaged: "Damaged",
};

function getStatusLabel(status: string, winnerId: string | null): string {
  if (status === "closed") return winnerId ? "Selesai" : "Gagal";
  if (status === "completed") return "Terkonfirmasi";
  if (status === "cancelled") return "Dibatalkan";
  if (status === "active") return "Aktif";
  if (status === "pending_approval") return "Menunggu Persetujuan";
  if (status === "rejected") return "Ditolak";
  return status;
}

type BidWithBidder = Bid & {
  bidder: Pick<Profile, "username" | "name" | "buyer_warning_count"> | null;
};
type FullAuction = Auction & {
  seller: Pick<Profile, "id" | "username" | "name" | "avatar_url" | "province">;
  winner: Pick<Profile, "id" | "username" | "name" | "province"> | null;
  category: Pick<Category, "name" | "slug">;
  bids: BidWithBidder[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("auctions")
    .select("title")
    .eq("id", id)
    .single();
  return { title: (data as { title: string } | null)?.title ?? "Lelang" };
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getUser();

  const { data: auctionRaw, error: auctionError } = await (supabase
    .from("auctions")
    .select(
      `*,
      seller:profiles!seller_id(id, username, name, avatar_url, province),
      winner:profiles!winner_id(id, username, name, province),
      category:categories(name, slug),
      bids(*, bidder:profiles!bidder_id(username, name, buyer_warning_count))`,
    )
    .eq("id", id)
    .single() as unknown as Promise<{
    data: FullAuction | null;
    error: object | null;
  }>);

  if (auctionError || !auctionRaw) notFound();

  let auction = auctionRaw;

  // Lelang yang menunggu persetujuan / ditolak hanya boleh dilihat oleh penjual
  // dan approver (admin/middleman). Pengguna lain → 404 (disembunyikan).
  const isApprover =
    !!currentUser &&
    (currentUser.role === "admin" || currentUser.is_middleman);
  if (
    (auction.status === "pending_approval" || auction.status === "rejected") &&
    currentUser?.id !== auction.seller.id &&
    !isApprover
  ) {
    notFound();
  }

  // Lazy close: if auction is still "active" but end_time has passed, close it now
  if (
    auction.status === "active" &&
    auction.end_time &&
    new Date(auction.end_time) < new Date()
  ) {
    const adminDb = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await adminDb.from("auctions").update({ status: "closed" }).eq("id", id);
    await createNotification(adminDb, {
      user_id: auction.seller.id,
      type: "auction_ended",
      auction_id: id,
    });
    if (auction.winner_id) {
      await createNotification(adminDb, {
        user_id: auction.winner_id,
        type: "auction_won",
        auction_id: id,
      });
    }
    auction = { ...auction, status: "closed" } as typeof auction;
  }

  // Fallback: jika confirmation_deadline belum diset tapi lelang sudah tutup dengan winner,
  // hitung dari end_time atau updated_at + 16 jam
  if (
    !auction.confirmation_deadline &&
    auction.winner_id &&
    !auction.transaction_confirmed &&
    (auction.status === "closed" || auction.status === "completed")
  ) {
    const base = auction.end_time ?? auction.updated_at;
    auction = {
      ...auction,
      confirmation_deadline: new Date(
        new Date(base).getTime() + 16 * 60 * 60 * 1000,
      ).toISOString(),
    } as typeof auction;
  }

  const { data: sellerStats } = await supabase
    .from("auctions")
    .select("status")
    .eq("seller_id", auction.seller.id)
    .neq("status", "cancelled");

  const totalSellerAuctions = sellerStats?.length ?? 0;
  const completedSellerAuctions =
    sellerStats?.filter((a) => a.status === "completed").length ?? 0;
  const sellerSuccessRate =
    totalSellerAuctions > 0
      ? Math.round((completedSellerAuctions / totalSellerAuctions) * 100)
      : null;

  supabase
    .from("auctions")
    .update({ view_count: (auction.view_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  const isEnded =
    auction.status !== "active" ||
    (auction.end_time ? new Date(auction.end_time) < new Date() : false);

  const isSeller = currentUser?.id === auction.seller.id;
  const isPending = auction.status === "pending_approval";
  const isRejected = auction.status === "rejected";

  const sortedBids = [...auction.bids].sort(
    (a, b) => Number(b.amount) - Number(a.amount),
  );

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link
          href="/auctions"
          className="hover:text-gray-700 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Lelang
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{auction.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ImageGallery images={auction.images} title={auction.title} />

          <div className="flex gap-2 flex-wrap">
            {auction.category && (
              <Badge variant="info">
                <span className="inline-flex items-center gap-1">
                  {getCategoryIcon(auction.category.slug) && (
                    // biome-ignore lint/performance/noImgElement: small local category icon
                    <img
                      src={getCategoryIcon(auction.category.slug) as string}
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  {auction.category.name}
                </span>
              </Badge>
            )}
            <Badge variant={conditionColors[auction.condition] ?? "default"}>
              {conditionLabels[auction.condition] ?? auction.condition}
            </Badge>
            <Badge variant={auction.free_shipping ? "success" : "default"}>
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {auction.free_shipping
                  ? "Gratis Ongkir"
                  : "Ongkir Ditanggung Pembeli"}
              </span>
            </Badge>
            <Badge
              variant={
                auction.status === "active"
                  ? "success"
                  : auction.status === "completed"
                    ? "info"
                    : auction.status === "pending_approval"
                      ? "warning"
                      : auction.status === "rejected" ||
                          (auction.status === "closed" && !auction.winner_id)
                        ? "danger"
                        : "default"
              }
            >
              {getStatusLabel(auction.status, auction.winner_id)}
            </Badge>
          </div>

          {/* Banner status persetujuan — untuk penjual & approver */}
          {isPending && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Menunggu persetujuan</p>
                <p className="text-amber-700 mt-0.5">
                  {isSeller
                    ? "Lelang ini sedang ditinjau admin/middleman dan belum tampil publik. Anda akan diberi tahu setelah ditinjau."
                    : "Lelang ini belum tampil publik. Tinjau dan setujui atau tolak di bawah."}
                </p>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Lelang ditolak</p>
                {auction.rejection_reason && (
                  <p className="mt-0.5">
                    <span className="font-medium">Alasan:</span>{" "}
                    {auction.rejection_reason}
                  </p>
                )}
                {isSeller && (
                  <p className="mt-1 text-red-600">
                    Silakan perbaiki dan buat lelang baru.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Kontrol persetujuan — hanya approver, saat menunggu */}
          {isPending && isApprover && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tinjau Lelang
              </p>
              <AuctionApprovalActions auctionId={auction.id} />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {auction.title}
            </h1>
            {auction.description && (
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {auction.description}
              </p>
            )}
          </div>

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
                {formatDate(auction.start_time, "id")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500">Harga Saat Ini</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatIDR(auction.current_price)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Mulai: {formatIDR(auction.starting_price)}
              </p>
            </div>

            {auction.end_time && !isEnded && (
              <CountdownTimer
                endTime={auction.end_time}
                auctionId={auction.id}
              />
            )}

            {isPending || isRejected ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                {isPending
                  ? "Bid belum dapat dilakukan sampai lelang disetujui."
                  : "Lelang ini ditolak dan tidak menerima bid."}
              </div>
            ) : (
              <BidForm
                auctionId={auction.id}
                currentPrice={auction.current_price}
                minIncrement={auction.min_bid_increment}
                buyNowPrice={auction.buy_now_price}
                auctionEnded={isEnded}
                isLoggedIn={!!currentUser}
                isSeller={isSeller}
              />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Penjual
            </p>
            <Link
              href={`/profile/${auction.seller.username}`}
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
                <p className="font-semibold text-gray-900 text-sm">
                  {auction.seller.name}
                </p>
                <p className="text-xs text-gray-500">
                  @{auction.seller.username}
                </p>
                {auction.seller.province && (
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {auction.seller.province}
                  </p>
                )}
              </div>
            </Link>
            <div className="mt-3 pt-3 border-t border-gray-100">
              {sellerSuccessRate !== null ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp
                    className={`h-3.5 w-3.5 ${sellerSuccessRate >= 60 ? "text-green-500" : "text-yellow-500"}`}
                  />
                  <span
                    className={`font-medium ${sellerSuccessRate >= 60 ? "text-green-700" : "text-yellow-700"}`}
                  >
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

            {currentUser && !isSeller && !isPending && !isRejected && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <Link
                  href={`/chat?seller=${auction.seller.id}&auction=${auction.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat Penjual
                </Link>
                <Link
                  href={`/profile/${auction.seller.username}?report=true`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Laporkan penjual"
                >
                  <Flag className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {isSeller &&
            (auction.status === "completed" || auction.status === "closed") &&
            auction.winner_id &&
            auction.winner && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pemenang
                </p>
                <Link
                  href={`/profile/${auction.winner.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm shrink-0">
                    {getInitials(auction.winner.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {auction.winner.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{auction.winner.username}
                    </p>
                    {auction.winner.province && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {auction.winner.province}
                      </p>
                    )}
                  </div>
                </Link>
                {auction.transaction_confirmed ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Transaksi Selesai
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5 text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 shrink-0" />
                        Menunggu transaksi diselesaikan
                      </div>
                      <p className="text-xs leading-relaxed text-amber-700/90">
                        Selesaikan pembayaran &amp; pengiriman dengan pemenang
                        lewat chat. Untuk keamanan tambahan Anda bisa mengundang{" "}
                        <span className="font-medium">middleman</span> (opsional)
                        dari halaman chat. Setelah transaksi beres, tekan{" "}
                        <span className="font-medium">Konfirmasi Transaksi</span>{" "}
                        di bawah.
                      </p>
                    </div>
                    {auction.confirmation_deadline && (
                      <ConfirmationCountdown
                        deadline={auction.confirmation_deadline}
                        label="Batas buyer konfirmasi"
                      />
                    )}
                  </>
                )}
                <Link
                  href={`/chat?seller=${auction.winner_id}&auction=${auction.id}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat Pemenang
                </Link>
                {!auction.transaction_confirmed && (
                  <ConfirmTransactionButton
                    auctionId={auction.id}
                    winnerUsername={auction.winner.username}
                  />
                )}
              </div>
            )}

          {!isSeller &&
            (auction.status === "completed" || auction.status === "closed") &&
            auction.winner_id === currentUser?.id && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status Transaksi
              </p>
              {auction.transaction_confirmed ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Transaksi selesai. Pembelian sukses!
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium bg-blue-50 rounded-lg px-3 py-2">
                    <Info className="h-4 w-4 shrink-0" />
                    Selamat, Anda memenangkan lelang ini!
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-gray-600">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Langkah selanjutnya
                    </p>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        Buka{" "}
                        <Link
                          href={`/chat?seller=${auction.seller.id}&auction=${auction.id}`}
                          className="text-blue-600 font-medium hover:underline"
                        >
                          chat dengan penjual
                        </Link>{" "}
                        dan mulai percakapan untuk membahas proses transaksi —
                        cara pembayaran, pengiriman, dan detail lainnya.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        Anda dan penjual bisa langsung bertransaksi tanpa
                        perantara. Namun untuk keamanan tambahan, Anda{" "}
                        <span className="font-medium text-gray-800">
                          boleh mengundang middleman
                        </span>{" "}
                        (opsional) — pengguna terverifikasi yang dapat diundang
                        ke percakapan untuk menjamin transaksi berjalan aman,
                        langsung dari halaman chat.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p>
                        Setelah transaksi selesai, penjual akan menekan{" "}
                        <span className="font-medium text-gray-800">
                          Konfirmasi Transaksi
                        </span>{" "}
                        dan pembelian Anda otomatis ditandai sukses.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/middleman"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-blue-200 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Pelajari & lihat daftar middleman
                  </Link>

                  {auction.confirmation_deadline && (
                    <ConfirmationCountdown
                      deadline={auction.confirmation_deadline}
                      label="Batas konfirmasi ke seller"
                    />
                  )}
                </>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Riwayat Bid
            </p>
            {sortedBids.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">
                Belum ada bid
              </p>
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
                          <span className="text-xs">
                            {bid.bidder?.buyer_warning_count}
                          </span>
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
