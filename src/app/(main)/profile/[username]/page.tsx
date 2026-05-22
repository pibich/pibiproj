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
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { MobileAccountMenu } from "@/components/profile/MobileAccountMenu";
import { ProfileReportSection } from "@/components/profile/ProfileReportSection";
import { Badge } from "@/components/ui/Badge";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatIDR, getInitials } from "@/lib/utils";
import type { Auction, Category, Profile } from "@/types/supabase";

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

type PendingConfirmAuction = Pick<
  Auction,
  "id" | "title" | "images" | "status" | "transaction_confirmed"
> & {
  winner: Pick<Profile, "username" | "name"> | null;
};

type BidWithAuction = {
  id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  auction: Pick<
    Auction,
    "id" | "title" | "current_price" | "status" | "end_time" | "images"
  > | null;
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
        `*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`,
      )
      .eq("seller_id", profile.id)
      .in("status", ["active", "closed", "completed"])
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("auctions")
      .select("status")
      .eq("seller_id", profile.id)
      .neq("status", "cancelled"),
  ]);

  const auctions = (auctionsResult.data ?? []) as AuctionWithRelations[];
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
  let pendingConfirmAuctions: PendingConfirmAuction[] = [];
  let buyerPendingAuctions: Array<{
    id: string;
    title: string;
    images: string[] | null;
  }> = [];
  let wonAuctionsCount = 0;

  if (isOwnProfile) {
    const [bidsRes, pendingSellerRes, pendingBuyerRes, wonCountRes] =
      await Promise.all([
        supabase
          .from("bids")
          .select(
            `*, auction:auctions(id, title, current_price, status, end_time, images)`,
          )
          .eq("bidder_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("auctions")
          .select(
            `id, title, images, status, transaction_confirmed, winner:profiles!winner_id(username, name)`,
          )
          .eq("seller_id", profile.id)
          .eq("transaction_confirmed", false)
          .not("winner_id", "is", null)
          .in("status", ["completed", "closed"])
          .order("updated_at", { ascending: false }),
        supabase
          .from("auctions")
          .select(`id, title, images, status, transaction_confirmed`)
          .eq("winner_id", profile.id)
          .eq("transaction_confirmed", false)
          .in("status", ["completed", "closed"])
          .order("updated_at", { ascending: false }),
        supabase
          .from("auctions")
          .select("id", { count: "exact", head: true })
          .eq("winner_id", profile.id)
          .eq("status", "completed"),
      ]);

    myBids = (bidsRes.data ?? []) as unknown as BidWithAuction[];
    pendingConfirmAuctions = (pendingSellerRes.data ??
      []) as unknown as PendingConfirmAuction[];
    buyerPendingAuctions = (pendingBuyerRes.data ??
      []) as typeof buyerPendingAuctions;
    wonAuctionsCount = wonCountRes.count ?? 0;
  }

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
          <div className="flex flex-col gap-8">
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
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Akun Anda memiliki{" "}
                  <strong>{profile.buyer_warning_count} peringatan</strong>{" "}
                  terkonfirmasi. Setelah 3 peringatan, akun akan masuk masa
                  timeout 1 minggu.
                </span>
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

            {/* Pending seller confirmation */}
            {pendingConfirmAuctions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Perlu Konfirmasi Transaksi
                  </h2>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200 divide-y divide-gray-100">
                  {pendingConfirmAuctions.map((auction) => (
                    <Link
                      key={auction.id}
                      href={`/auctions/${auction.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {auction.images?.[0] ? (
                            // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                            <img
                              src={auction.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gavel className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {auction.title}
                          </p>
                          {auction.winner && (
                            <p className="text-xs text-gray-500">
                              Pemenang: @{auction.winner.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="warning" className="text-xs shrink-0">
                        Konfirmasi →
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pending buyer confirmation */}
            {buyerPendingAuctions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Menunggu Konfirmasi Penjual
                  </h2>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 divide-y divide-gray-100">
                  {buyerPendingAuctions.map((auction) => (
                    <Link
                      key={auction.id}
                      href={`/auctions/${auction.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {auction.images?.[0] ? (
                            // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                            <img
                              src={auction.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gavel className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {auction.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Menunggu konfirmasi pembayaran dari penjual
                          </p>
                        </div>
                      </div>
                      <Badge variant="info" className="text-xs shrink-0">
                        Menunggu
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Lelang Saya */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lelang Saya
                </h2>
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
            </div>

            {/* Bid Saya */}
            {myBids.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Bid Saya
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {myBids.map((bid) => (
                    <Link
                      key={bid.id}
                      href={`/auctions/${bid.auction?.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {bid.auction?.images?.[0] ? (
                            // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                            <img
                              src={bid.auction.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gavel className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {bid.auction?.title ?? "Lelang"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Bid saya: {formatIDR(bid.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-blue-600">
                          {formatIDR(bid.auction?.current_price ?? 0)}
                        </p>
                        <Badge
                          variant={
                            bid.is_winning
                              ? "success"
                              : bid.auction?.status === "closed"
                                ? "default"
                                : "warning"
                          }
                          className="text-xs"
                        >
                          {bid.is_winning ? "Tertinggi" : "Kalah"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
