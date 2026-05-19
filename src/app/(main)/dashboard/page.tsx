import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatIDR } from "@/lib/utils";
import { Gavel, Package, AlertTriangle, Plus, Trophy, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import type { Auction, Category, Profile } from "@/types/supabase";

export const metadata: Metadata = { title: "Dashboard" };

type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

type PendingConfirmAuction = Pick<Auction, "id" | "title" | "images" | "status" | "transaction_confirmed"> & {
  winner: Pick<Profile, "username" | "name"> | null;
};

type BidWithAuction = {
  id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  auction: Pick<Auction, "id" | "title" | "current_price" | "status" | "end_time" | "images"> | null;
};

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [
    { data: myAuctions },
    { data: myBids },
    { data: wonAuctions },
    { data: pendingConfirmAuctions },
    { data: buyerPendingAuctions },
  ] = await Promise.all([
    supabase
      .from("auctions")
      .select(`*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("bids")
      .select(`*, auction:auctions(id, title, current_price, status, end_time, images)`)
      .eq("bidder_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("auctions")
      .select(`*, seller:profiles!seller_id(username, name), category:categories(name, slug), bids(count)`)
      .eq("winner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("auctions")
      .select(`id, title, images, status, transaction_confirmed, winner:profiles!winner_id(username, name)`)
      .eq("seller_id", user.id)
      .eq("transaction_confirmed", false)
      .not("winner_id", "is", null)
      .in("status", ["completed", "closed"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("auctions")
      .select(`id, title, images, status, transaction_confirmed`)
      .eq("winner_id", user.id)
      .eq("transaction_confirmed", false)
      .in("status", ["completed", "closed"])
      .order("updated_at", { ascending: false }),
  ]);

  const typedBids = (myBids ?? []) as unknown as BidWithAuction[];
  const typedPendingConfirm = (pendingConfirmAuctions ?? []) as unknown as PendingConfirmAuction[];
  const typedMyAuctions = (myAuctions ?? []) as unknown as AuctionWithRelations[];
  const activeAuctions = typedMyAuctions.filter((a) => a.status === "active");

  const stats = [
    { label: "Lelang Aktif", value: activeAuctions.length, icon: Gavel, color: "text-blue-600" },
    { label: "Total Bid", value: typedBids.length, icon: Package, color: "text-purple-600" },
    { label: "Lelang Dimenangkan", value: wonAuctions?.length ?? 0, icon: Trophy, color: "text-green-600" },
    { label: "Penjualan Sukses", value: user.successful_sales ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Pembelian Sukses", value: user.successful_purchases ?? 0, icon: ShoppingBag, color: "text-teal-600" },
    {
      label: "Peringatan",
      value: user.buyer_warning_count,
      icon: AlertTriangle,
      color: user.buyer_warning_count > 0 ? "text-orange-500" : "text-gray-400",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Selamat datang, {user.name}!</p>
        </div>
        <Link href="/auctions/create">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Lelang
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {user.buyer_timeout_until && new Date(user.buyer_timeout_until) > new Date() && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Akun Anda sedang dalam masa <strong>timeout</strong>. Anda tidak dapat melakukan bid
            hingga{" "}
            <strong>
              {new Date(user.buyer_timeout_until).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
            .
          </span>
        </div>
      )}
      {!user.buyer_timeout_until && user.buyer_warning_count > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Akun Anda memiliki <strong>{user.buyer_warning_count} peringatan</strong> terkonfirmasi.
            Setelah 3 peringatan, akun akan masuk masa timeout 1 minggu.
          </span>
        </div>
      )}

      {typedPendingConfirm.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900">Perlu Konfirmasi Transaksi</h2>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 divide-y divide-gray-100">
            {typedPendingConfirm.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {auction.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={auction.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{auction.title}</p>
                    {auction.winner && (
                      <p className="text-xs text-gray-500">Pemenang: @{auction.winner.username}</p>
                    )}
                  </div>
                </div>
                <Badge variant="warning" className="text-xs shrink-0">Konfirmasi →</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(buyerPendingAuctions ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900">Menunggu Konfirmasi Penjual</h2>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 divide-y divide-gray-100">
            {(buyerPendingAuctions ?? []).map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {auction.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={auction.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gavel className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{auction.title}</p>
                    <p className="text-xs text-gray-500">Menunggu konfirmasi pembayaran dari penjual</p>
                  </div>
                </div>
                <Badge variant="info" className="text-xs shrink-0">Menunggu</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Lelang Saya</h2>
        </div>

        {typedMyAuctions.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
            <Gavel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Anda belum membuat lelang</p>
            <Link href="/auctions/create" className="mt-3 inline-block">
              <Button size="sm">Buat Lelang Pertama</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {typedMyAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>

      {typedBids.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bid Saya</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {typedBids.map((bid) => (
              <Link
                key={bid.id}
                href={`/auctions/${bid.auction?.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {bid.auction?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bid.auction.images[0]} alt="" className="w-full h-full object-cover" />
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
                    <p className="text-xs text-gray-500">Bid saya: {formatIDR(bid.amount)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-blue-600">
                    {formatIDR(bid.auction?.current_price ?? 0)}
                  </p>
                  <Badge
                    variant={bid.is_winning ? "success" : bid.auction?.status === "closed" ? "default" : "warning"}
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
  );
}
