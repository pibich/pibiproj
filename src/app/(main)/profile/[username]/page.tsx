import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { ConfirmTransactionButton } from "@/components/auction/ConfirmTransactionButton";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { MobileAccountMenu } from "@/components/profile/MobileAccountMenu";
import { AuctionListCard } from "@/components/profile/AuctionListCard";
import { OwnProfileTabs } from "@/components/profile/OwnProfileTabs";
import { ProfileReportSection } from "@/components/profile/ProfileReportSection";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationCountdown } from "@/components/ui/ConfirmationCountdown";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatIDR, formatRelativeTime, getInitials } from "@/lib/utils";
import type { Auction, BuyerWarning, Category, Profile } from "@/types/supabase";

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  winner: Pick<Profile, "username" | "name"> | null;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

type BidWithAuction = {
  id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  auction: Pick<
    Auction,
    "id" | "title" | "current_price" | "status" | "end_time" | "images" | "winner_id" | "transaction_confirmed"
  > | null;
};

type TransactionWithRelations = {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  middleman_id: string | null;
  amount: number;
  status: "awaiting_payment" | "awaiting_shipment" | "shipped" | "delivery_confirmed" | "completed" | "cancelled";
  shipping_tracking_number: string | null;
  shipping_photo_url: string | null;
  receipt_photo_url: string | null;
  stream_channel_id: string | null;
  auction: { id: string; title: string; images: string[] } | null;
  seller: { id: string; username: string; name: string } | null;
  buyer: { id: string; username: string; name: string } | null;
  middleman: { id: string; username: string; name: string } | null;
};

type WonAuction = {
  id: string;
  title: string;
  images: string[] | null;
  current_price: number;
  seller_id: string;
  confirmation_deadline: string | null;
  seller: { username: string; name: string } | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ report?: string }>;
}) {
  const { username } = await params;
  const { report } = await searchParams;

  const supabase = await createClient();
  const currentUser = await getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const isOwnProfile = !!currentUser && currentUser.id === profile.id;
  const canReport = !!currentUser && currentUser.id !== profile.id;

  const [auctionsResult, sellerStatsResult] = await Promise.all([
    supabase
      .from("auctions")
      .select(
        `*, seller:profiles!seller_id(username, name), winner:profiles!winner_id(username, name), category:categories(name, slug), bids(count)`,
      )
      .eq("seller_id", profile.id)
      .in("status", ["active", "closed", "completed"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("auctions")
      .select("status")
      .eq("seller_id", profile.id)
      .neq("status", "cancelled"),
  ]);

  const auctions = (auctionsResult.data ?? []) as unknown as AuctionWithRelations[];
  const sellerStats = sellerStatsResult.data ?? [];

  const activeAuctions = auctions.filter((a) => a.status === "active");
  const completedAuctions = auctions.filter(
    (a) => a.status === "completed" || a.status === "closed",
  );

  const totalAuctions = sellerStats.length;
  const completedCount = sellerStats.filter(
    (a) => a.status === "completed",
  ).length;
  const sellerSuccessRate =
    totalAuctions > 0
      ? Math.round((completedCount / totalAuctions) * 100)
      : null;

  const isTimedOut =
    profile.buyer_timeout_until &&
    new Date(profile.buyer_timeout_until) > new Date();

  // Additional data for own-profile dashboard sections
  let myBids: BidWithAuction[] = [];
  let wonAuctionsCount = 0;
  let sellerTransactions: TransactionWithRelations[] = [];
  let buyerTransactions: TransactionWithRelations[] = [];
  let wonAuctions: WonAuction[] = [];
  let buyerWarnings: BuyerWarning[] = [];

  if (isOwnProfile) {
    const txQuery = supabase
      .from("transactions")
      .select(
        `*, auction:auctions(id, title, images), seller:profiles!seller_id(id, username, name), buyer:profiles!buyer_id(id, username, name), middleman:profiles!middleman_id(id, username, name)`,
      )
      .not("status", "in", '("completed","cancelled")')
      .order("updated_at", { ascending: false });

    const [bidsRes, wonCountRes, txRes, wonAuctionsRes, warningsRes] = await Promise.all([
      supabase
        .from("bids")
        .select(
          `*, auction:auctions(id, title, current_price, status, end_time, images, winner_id, transaction_confirmed)`,
        )
        .eq("bidder_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("auctions")
        .select("id", { count: "exact", head: true })
        .eq("winner_id", profile.id)
        .in("status", ["completed", "closed"]),
      txQuery,
      supabase
        .from("auctions")
        .select("id, title, images, current_price, seller_id, confirmation_deadline, seller:profiles!seller_id(username, name)")
        .eq("winner_id", profile.id)
        .in("status", ["closed", "completed"])
        .eq("transaction_confirmed", false)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("buyer_warnings")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    myBids = (bidsRes.data ?? []) as unknown as BidWithAuction[];
    wonAuctionsCount = wonCountRes.count ?? 0;
    wonAuctions = (wonAuctionsRes.data ?? []) as unknown as WonAuction[];
    buyerWarnings = (warningsRes.data ?? []) as BuyerWarning[];

    const allTx = (txRes.data ?? []) as unknown as TransactionWithRelations[];
    // Transaksi sebagai middleman ditampilkan di dashboard middleman terpisah
    // (/middleman/dashboard), bukan di profil pribadi.
    sellerTransactions = allTx.filter((t) => t.seller_id === profile.id);
    buyerTransactions = allTx.filter((t) => t.buyer_id === profile.id && t.seller_id !== profile.id);
  }

  // Derived sets for filtering
  const sellerTxAuctionIds = new Set(sellerTransactions.map((t) => t.auction_id));
  const buyerTxAuctionIds = new Set(buyerTransactions.map((t) => t.auction_id));

  // "Berakhir - Perlu Tindakan": ended with winner, no transaction yet
  const perluTindakan = auctions.filter(
    (a) =>
      (a.status === "closed" || a.status === "completed") &&
      a.winner_id &&
      !a.transaction_confirmed &&
      !sellerTxAuctionIds.has(a.id),
  );

  // "Menang - Belum Transaksi": user won, no active transaction
  const menangBelumTransaksi = wonAuctions.filter(
    (a) => !buyerTxAuctionIds.has(a.id),
  );

  // Bids by category
  const bidAktif = myBids.filter((b) => b.auction?.status === "active");
  const bidEnded = myBids.filter(
    (b) =>
      b.auction?.status === "closed" ||
      b.auction?.status === "completed",
  );
  const bidMenang = bidEnded.filter((b) => b.auction?.winner_id === currentUser?.id);
  const bidKalah = bidEnded.filter((b) => b.auction?.winner_id !== currentUser?.id);

  const ownStats = [
    {
      label: "Lelang Aktif",
      value: activeAuctions.length,
      icon: Gavel,
      color: "text-blue-600",
    },
    {
      label: "Total Bid",
      value: myBids.length,
      icon: Package,
      color: "text-purple-600",
    },
    {
      label: "Dimenangkan",
      value: wonAuctionsCount,
      icon: Trophy,
      color: "text-green-600",
    },
    {
      label: "Penjualan Sukses",
      value: profile.successful_sales ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
    },
    {
      label: "Pembelian Sukses",
      value: profile.successful_purchases ?? 0,
      icon: ShoppingBag,
      color: "text-teal-600",
    },
    {
      label: "Peringatan",
      value: profile.buyer_warning_count,
      icon: AlertTriangle,
      color:
        profile.buyer_warning_count > 0 ? "text-orange-500" : "text-gray-400",
    },
  ];

  return (
    <>
      {!isOwnProfile && <MobileBackBar />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
              {profile.avatar_url ? (
                // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                getInitials(profile.name)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.name}
              </h1>
              <p className="text-gray-500 text-sm">@{profile.username}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                {profile.buyer_warning_count > 0 && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {profile.buyer_warning_count}x peringatan
                  </Badge>
                )}
                {isTimedOut && (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Timeout
                  </Badge>
                )}
                {profile.is_middleman && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Middleman
                  </Badge>
                )}
                {(profile.successful_sales ?? 0) > 0 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {profile.successful_sales} penjualan sukses
                  </Badge>
                )}
                {(profile.successful_purchases ?? 0) > 0 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    {profile.successful_purchases} pembelian sukses
                  </Badge>
                )}
                {canReport && (
                  <ProfileReportSection
                    reportedUserId={profile.id}
                    reportedUsername={profile.username}
                    openReport={report === "true"}
                  />
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap justify-center sm:justify-start">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Bergabung sejak {formatDate(profile.created_at, "id")}
                </span>
                <span className="flex items-center gap-1">
                  <Gavel className="h-4 w-4" />
                  {activeAuctions.length} Lelang Aktif
                </span>
                {sellerSuccessRate !== null ? (
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      sellerSuccessRate >= 60
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {sellerSuccessRate}% berhasil
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Belum ada riwayat lelang
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account menu — own profile, mobile only */}
        {isOwnProfile && <MobileAccountMenu />}

        {/* ── Own profile: dashboard sections ─────────────────────────── */}
        {isOwnProfile && (
          <div className="flex flex-col gap-6">
            {/* Alert banners */}
            {isTimedOut && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Akun Anda sedang dalam masa <strong>timeout</strong>. Anda
                  tidak dapat melakukan bid hingga{" "}
                  <strong>
                    {new Date(
                      profile.buyer_timeout_until ?? "",
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  .
                </span>
              </div>
            )}
            {!isTimedOut && profile.buyer_warning_count > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Akun Anda memiliki{" "}
                    <strong>{profile.buyer_warning_count} peringatan</strong>{" "}
                    terkonfirmasi. Setelah 3 peringatan, akun akan masuk masa
                    timeout 1 minggu.
                  </span>
                </div>
                {buyerWarnings.length > 0 && (
                  <div className="flex flex-col gap-1 ml-6 border-l-2 border-orange-200 pl-3">
                    {buyerWarnings.map((w, i) => (
                      <div key={w.id} className="text-xs text-orange-600">
                        <span className="font-semibold">Peringatan {buyerWarnings.length - i}</span>
                        {w.note && <span className="text-orange-500"> — {w.note}</span>}
                        <span className="text-orange-400 ml-1">
                          ({new Date(w.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {ownStats.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Tabs: Lelang Saya | Bid Saya ── */}
            <OwnProfileTabs
              myAuctionsContent={
                <div className="flex flex-col gap-6">
                  {/* 1. Berlangsung */}
                  {activeAuctions.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Berlangsung
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {activeAuctions.length} lelang
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {activeAuctions.map((a) => {
                          const bidCount = (a as unknown as { bids?: { count: number }[] }).bids?.[0]?.count ?? 0;
                          return (
                            <AuctionListCard
                              key={a.id}
                              image={a.images?.[0] ?? null}
                              title={a.title}
                              href={`/auctions/${a.id}`}
                              price={a.current_price}
                              badge={{ label: "AKTIF", variant: "success" }}
                              subInfo={`${bidCount} bid${a.end_time ? ` · Berakhir ${formatRelativeTime(a.end_time)}` : ""}`}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* 2. Dalam Transaksi (seller) */}
                  {sellerTransactions.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        Dalam Transaksi
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {sellerTransactions.length} transaksi
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sellerTransactions.map((tx) => (
                          <TransactionCard
                            key={tx.id}
                            transaction={tx}
                            currentUserId={currentUser!.id}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 3. Berakhir - Perlu Tindakan */}
                  {perluTindakan.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Berakhir — Perlu Tindakan
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {perluTindakan.length} lelang
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {perluTindakan.map((a) => (
                          <div key={a.id} className="flex flex-col gap-1.5">
                            <AuctionListCard
                              image={a.images?.[0] ?? null}
                              title={a.title}
                              href={`/auctions/${a.id}`}
                              price={a.current_price}
                              badge={{ label: "BUTUH TINDAKAN", variant: "warning" }}
                              subInfo={a.winner ? `Pemenang: @${a.winner.username}` : undefined}
                              actionLabel="Lihat Lelang"
                            />
                            {(a as unknown as { confirmation_deadline?: string | null }).confirmation_deadline && (
                              <ConfirmationCountdown
                                deadline={(a as unknown as { confirmation_deadline: string }).confirmation_deadline}
                                label="Batas buyer konfirmasi"
                              />
                            )}
                            {/* Deal langsung tanpa middleman — perluTindakan sudah
                                difilter dari lelang ber-transaksi escrow (sellerTxAuctionIds). */}
                            {a.winner && (
                              <ConfirmTransactionButton
                                auctionId={a.id}
                                winnerUsername={a.winner.username}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 4. Semua Lelang (collapsed — show all auctions grid) */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        Semua Lelang
                      </h3>
                      <Link
                        href="/auctions/create"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Buat Lelang
                      </Link>
                    </div>
                    {auctions.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                        <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          Anda belum membuat lelang
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {auctions.map((a) => (
                          <AuctionCard key={a.id} auction={a} />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              }
              myBidsContent={
                <div className="flex flex-col gap-6">
                  {/* 1. Bid Aktif */}
                  {bidAktif.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Bid Aktif
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {bidAktif.length} bid
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {bidAktif.map((bid) => (
                          <AuctionListCard
                            key={bid.id}
                            image={bid.auction?.images?.[0] ?? null}
                            title={bid.auction?.title ?? "Lelang"}
                            href={`/auctions/${bid.auction?.id}`}
                            price={bid.auction?.current_price ?? 0}
                            badge={
                              bid.is_winning
                                ? { label: "TERTINGGI", variant: "success" }
                                : { label: "DIKALAHKAN", variant: "warning" }
                            }
                            subInfo={`Bid saya: ${formatIDR(bid.amount)} | Saat ini: ${formatIDR(bid.auction?.current_price ?? 0)}`}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 2. Dalam Transaksi (buyer) */}
                  {buyerTransactions.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                        Dalam Transaksi
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {buyerTransactions.length} transaksi
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {buyerTransactions.map((tx) => (
                          <TransactionCard
                            key={tx.id}
                            transaction={tx}
                            currentUserId={currentUser!.id}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 3. Menang - Belum Transaksi */}
                  {menangBelumTransaksi.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Menang — Belum Transaksi
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {menangBelumTransaksi.length} lelang
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {menangBelumTransaksi.map((a) => (
                          <div key={a.id} className="flex flex-col gap-1.5">
                            <AuctionListCard
                              image={a.images?.[0] ?? null}
                              title={a.title}
                              href={`/auctions/${a.id}`}
                              price={a.current_price}
                              badge={{ label: "MENANG", variant: "success" }}
                              subInfo={a.seller ? `Seller: @${a.seller.username}` : undefined}
                              chatHref={`/chat?seller=${a.seller_id}`}
                            />
                            {a.confirmation_deadline && (
                              <ConfirmationCountdown
                                deadline={a.confirmation_deadline}
                                label="Batas konfirmasi ke seller"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 4. Tidak Menang */}
                  {bidKalah.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        Tidak Menang
                        <span className="ml-auto normal-case font-normal text-gray-400">
                          {bidKalah.length} bid
                        </span>
                      </h3>
                      <div className="flex flex-col gap-2">
                        {bidKalah.map((bid) => (
                          <AuctionListCard
                            key={bid.id}
                            image={bid.auction?.images?.[0] ?? null}
                            title={bid.auction?.title ?? "Lelang"}
                            href={`/auctions/${bid.auction?.id}`}
                            price={bid.auction?.current_price ?? 0}
                            badge={{ label: "TIDAK MENANG", variant: "default" }}
                            subInfo={`Bid saya: ${formatIDR(bid.amount)}`}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Won bids in bidMenang that are in transaction are covered by buyerTransactions */}
                  {bidMenang.length > 0 && buyerTransactions.length === 0 && menangBelumTransaksi.length === 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Menang
                      </h3>
                      <div className="flex flex-col gap-2">
                        {bidMenang.map((bid) => (
                          <AuctionListCard
                            key={bid.id}
                            image={bid.auction?.images?.[0] ?? null}
                            title={bid.auction?.title ?? "Lelang"}
                            href={`/auctions/${bid.auction?.id}`}
                            price={bid.auction?.current_price ?? 0}
                            badge={{ label: "MENANG", variant: "success" }}
                            subInfo={bid.auction?.transaction_confirmed ? "Transaksi selesai" : undefined}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {myBids.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        Anda belum melakukan bid
                      </p>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        )}

        {/* ── Others' profile: public auction sections ─────────────────── */}
        {!isOwnProfile && (
          <>
            {activeAuctions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Lelang Aktif
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeAuctions.map((a) => (
                    <AuctionCard key={a.id} auction={a} />
                  ))}
                </div>
              </div>
            )}

            {completedAuctions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Lelang Selesai
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {completedAuctions.map((a) => (
                    <AuctionCard key={a.id} auction={a} />
                  ))}
                </div>
              </div>
            )}

            {auctions.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Belum ada lelang</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
