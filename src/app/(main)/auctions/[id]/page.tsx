export const dynamic = "force-dynamic";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flag,
  Info,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionApprovalActions } from "@/components/admin/AuctionApprovalActions";
import { AuctionTabs } from "@/components/auction/AuctionTabs";
import { BidPanel } from "@/components/auction/BidPanel";
import { ConfirmTransactionButton } from "@/components/auction/ConfirmTransactionButton";
import { FailWinnerButton } from "@/components/auction/FailWinnerButton";
import { ImageGallery } from "@/components/auction/ImageGallery";
import { BuyerReviewButton } from "@/components/transaction/BuyerReviewButton";
import { getCategoryIcon } from "@/lib/categories";
import { getUser } from "@/lib/dal";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";
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

const conditionDot: Record<string, string> = {
  mint: "bg-teal-500",
  near_mint: "bg-teal-500",
  excellent: "bg-amber-500",
  good: "bg-amber-500",
  light_play: "bg-orange-500",
  heavy_play: "bg-orange-500",
  damaged: "bg-red-500",
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
  seller: Pick<
    Profile,
    | "id"
    | "username"
    | "name"
    | "avatar_url"
    | "province"
    | "successful_sales"
    | "is_middleman"
  >;
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
      seller:profiles!seller_id(id, username, name, avatar_url, province, successful_sales, is_middleman),
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
    !!currentUser && (currentUser.role === "admin" || currentUser.is_middleman);
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

  const [{ data: sellerStats }, { data: sellerReviews }] = await Promise.all([
    supabase
      .from("auctions")
      .select("status")
      .eq("seller_id", auction.seller.id)
      .neq("status", "cancelled"),
    supabase
      .from("reviews")
      .select("rating")
      .eq("seller_id", auction.seller.id),
  ]);

  const totalSellerAuctions = sellerStats?.length ?? 0;
  const completedSellerAuctions =
    sellerStats?.filter((a) => a.status === "completed").length ?? 0;
  const sellerSuccessRate =
    totalSellerAuctions > 0
      ? Math.round((completedSellerAuctions / totalSellerAuctions) * 100)
      : null;

  const sellerReviewCount = sellerReviews?.length ?? 0;
  const sellerRating =
    sellerReviews && sellerReviewCount > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviewCount
      : null;

  // Buyer review state — for the winning buyer once the transaction is confirmed.
  let buyerTransaction: {
    id: string;
    receipt_photo_url: string | null;
  } | null = null;
  let buyerHasReviewed = false;
  if (
    currentUser &&
    auction.winner_id === currentUser.id &&
    auction.transaction_confirmed
  ) {
    const { data: tx } = await supabase
      .from("transactions")
      .select("id, receipt_photo_url")
      .eq("auction_id", auction.id)
      .maybeSingle();
    buyerTransaction = tx ?? null;
    if (tx) {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("transaction_id", tx.id)
        .eq("buyer_id", currentUser.id)
        .maybeSingle();
      buyerHasReviewed = !!existingReview;
    }
  }

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

  const categoryIcon = auction.category
    ? getCategoryIcon(auction.category.slug)
    : null;

  const bidItems = sortedBids.map((b) => ({
    id: b.id,
    username: b.bidder?.username ?? "unknown",
    amount: Number(b.amount),
    warningCount: b.bidder?.buyer_warning_count ?? 0,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
        <Link
          href="/auctions"
          className="flex items-center gap-1 hover:text-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Lelang
        </Link>
        {auction.category && (
          <>
            <span>/</span>
            <span>{auction.category.name}</span>
          </>
        )}
        <span>/</span>
        <span className="text-slate-900 line-clamp-1">{auction.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Left — gallery */}
        <div>
          <ImageGallery images={auction.images} title={auction.title} />
        </div>

        {/* Right — info & bidding */}
        <div className="flex flex-col gap-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <span
              className={`h-2.5 w-2.5 rounded-sm ${conditionDot[auction.condition] ?? "bg-slate-400"}`}
            />
            {auction.category && <span>{auction.category.name}</span>}
            <span className="text-slate-300">·</span>
            <span>
              {conditionLabels[auction.condition] ?? auction.condition}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.7rem]">
            {auction.title}
          </h1>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <span
                className={`h-1.5 w-1.5 rounded-full ${conditionDot[auction.condition] ?? "bg-slate-400"}`}
              />
              {conditionLabels[auction.condition] ?? auction.condition}
            </span>
            {auction.category && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {categoryIcon && (
                  // biome-ignore lint/performance/noImgElement: small local category icon
                  <img
                    src={categoryIcon}
                    alt=""
                    className="h-3.5 w-3.5 object-contain"
                  />
                )}
                {auction.category.name}
              </span>
            )}
            {auction.free_shipping && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                <Truck className="h-3 w-3" />
                Gratis Ongkir
              </span>
            )}
            {!isEnded && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {getStatusLabel(auction.status, auction.winner_id)}
              </span>
            )}
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

          {/* Bid panel */}
          {isPending || isRejected ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              {isPending
                ? "Bid belum dapat dilakukan sampai lelang disetujui."
                : "Lelang ini ditolak dan tidak menerima bid."}
            </div>
          ) : (
            <BidPanel
              auctionId={auction.id}
              currentPrice={auction.current_price}
              minIncrement={auction.min_bid_increment}
              buyNowPrice={auction.buy_now_price}
              endTime={auction.end_time}
              bidCount={sortedBids.length}
              auctionEnded={isEnded}
              isLoggedIn={!!currentUser}
              isSeller={isSeller}
            />
          )}

          {/* Seller card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${auction.seller.username}`}
                className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
                  {auction.seller.avatar_url ? (
                    // biome-ignore lint/performance/noImgElement: Supabase CDN URL
                    <img
                      src={auction.seller.avatar_url}
                      alt={auction.seller.name}
                      className="h-11 w-11 object-cover"
                    />
                  ) : (
                    getInitials(auction.seller.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-bold text-slate-900">
                    @{auction.seller.username}
                    {auction.seller.is_middleman && (
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    {sellerRating != null && (
                      <>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-700">
                          {sellerRating.toFixed(1)}
                        </span>
                        <span className="text-slate-300">·</span>
                      </>
                    )}
                    {auction.seller.successful_sales ?? 0} transaksi
                    {sellerSuccessRate !== null && (
                      <>
                        <span className="text-slate-300">·</span>
                        {sellerSuccessRate}% berhasil
                      </>
                    )}
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/profile/${auction.seller.username}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Profil
                </Link>
                {currentUser && !isSeller && !isPending && !isRejected && (
                  <>
                    <Link
                      href={`/chat?seller=${auction.seller.id}&auction=${auction.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat
                    </Link>
                    <Link
                      href={`/profile/${auction.seller.username}?report=true`}
                      aria-label="Laporkan penjual"
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middleman notice */}
          {!isSeller && !isPending && !isRejected && (
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <p>
                Transaksi bernilai tinggi? Undang{" "}
                <Link
                  href="/middleman"
                  className="font-semibold text-teal-700 hover:underline"
                >
                  middleman
                </Link>{" "}
                agar dana ditahan sampai kartu diterima.
              </p>
            </div>
          )}

          {/* Panel pemenang — penjual */}
          {isSeller &&
            (auction.status === "completed" || auction.status === "closed") &&
            auction.winner_id &&
            auction.winner && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
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
                        Menunggu pembayaran dari pemenang
                      </div>
                      <p className="text-xs leading-relaxed text-amber-700/90">
                        Selesaikan pembayaran &amp; pengiriman dengan pemenang
                        lewat chat. Untuk keamanan tambahan Anda bisa mengundang{" "}
                        <span className="font-medium">middleman</span>{" "}
                        (opsional) dari halaman chat. Jika sudah dibayar, tekan{" "}
                        <span className="font-medium">
                          Konfirmasi Transaksi
                        </span>
                        . Jika pemenang menghilang dan tidak membayar, gagalkan
                        lelang di bawah.
                      </p>
                    </div>
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
                  <>
                    <ConfirmTransactionButton
                      auctionId={auction.id}
                      winnerUsername={auction.winner.username}
                    />
                    <FailWinnerButton
                      auctionId={auction.id}
                      winnerUsername={auction.winner.username}
                    />
                  </>
                )}
              </div>
            )}

          {/* Panel pemenang — pembeli */}
          {!isSeller &&
            (auction.status === "completed" || auction.status === "closed") &&
            auction.winner_id === currentUser?.id && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status Transaksi
                </p>
                {auction.transaction_confirmed ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 rounded-lg px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Transaksi selesai. Pembelian sukses!
                    </div>
                    {buyerTransaction && (
                      <BuyerReviewButton
                        transactionId={buyerTransaction.id}
                        auctionTitle={auction.title}
                        receiptPhotoUrl={buyerTransaction.receipt_photo_url}
                        alreadyReviewed={buyerHasReviewed}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-teal-600 text-sm font-medium bg-teal-50 rounded-lg px-3 py-2">
                      <Info className="h-4 w-4 shrink-0" />
                      Selamat, Anda memenangkan lelang ini!
                    </div>

                    <div className="flex flex-col gap-3 text-sm text-gray-600">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Langkah selanjutnya
                      </p>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Buka{" "}
                          <Link
                            href={`/chat?seller=${auction.seller.id}&auction=${auction.id}`}
                            className="text-teal-600 font-medium hover:underline"
                          >
                            chat dengan penjual
                          </Link>{" "}
                          dan mulai percakapan untuk membahas proses transaksi —
                          cara pembayaran, pengiriman, dan detail lainnya.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Anda dan penjual bisa langsung bertransaksi tanpa
                          perantara. Namun untuk keamanan tambahan, Anda{" "}
                          <span className="font-medium text-gray-800">
                            boleh mengundang middleman
                          </span>{" "}
                          (opsional) — pengguna terverifikasi yang dapat
                          diundang ke percakapan untuk menjamin transaksi
                          berjalan aman, langsung dari halaman chat.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-teal-200 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Pelajari & lihat daftar middleman
                    </Link>
                  </>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Tabs — deskripsi / riwayat tawaran / pengiriman */}
      <div className="mt-10 max-w-3xl">
        <AuctionTabs
          description={auction.description}
          bids={bidItems}
          freeShipping={auction.free_shipping}
          province={auction.seller.province}
        />
      </div>
    </div>
  );
}
