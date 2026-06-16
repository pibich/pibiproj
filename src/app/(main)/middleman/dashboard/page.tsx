import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  type PendingAuctionItem,
  PendingAuctionList,
} from "@/components/admin/PendingAuctionList";
import { StatTile, type StatTint } from "@/components/dashboard/StatTile";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { TransactionCard } from "@/components/transaction/TransactionCard";
import { getUser } from "@/lib/dal";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard Middleman" };

type TransactionWithRelations = {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  middleman_id: string | null;
  amount: number;
  status:
    | "awaiting_payment"
    | "awaiting_shipment"
    | "shipped"
    | "delivery_confirmed"
    | "completed"
    | "cancelled";
  shipping_tracking_number: string | null;
  shipping_photo_url: string | null;
  receipt_photo_url: string | null;
  stream_channel_id: string | null;
  auction: { id: string; title: string; images: string[] } | null;
  seller: { id: string; username: string; name: string } | null;
  buyer: { id: string; username: string; name: string } | null;
  middleman: { id: string; username: string; name: string } | null;
};

const SELECT =
  "*, auction:auctions(id, title, images), seller:profiles!seller_id(id, username, name), buyer:profiles!buyer_id(id, username, name), middleman:profiles!middleman_id(id, username, name)";

export default async function MiddlemanDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.is_middleman) redirect("/");

  const supabase = await createClient();

  const adminDb = createAdminClient();

  // The dashboard only handles transactions the middleman mediates for OTHER
  // people. When the middleman is also the buyer or seller it's a personal
  // transaction — that belongs to their profile only (otherwise the rating /
  // review / confirmation gets duplicated across both pages). Likewise, an
  // auction the middleman submitted themselves is reviewed by an admin, not
  // self-approved here.
  const [activeRes, completedRes, pendingRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(SELECT)
      .eq("middleman_id", user.id)
      .neq("seller_id", user.id)
      .neq("buyer_id", user.id)
      .not("status", "in", '("completed","cancelled")')
      .order("updated_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(SELECT)
      .eq("middleman_id", user.id)
      .neq("seller_id", user.id)
      .neq("buyer_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(20),
    adminDb
      .from("auctions")
      .select(
        "id, title, images, starting_price, current_price, created_at, end_time, seller:profiles!seller_id(username, name), category:categories(name)",
      )
      .eq("status", "pending_approval")
      .neq("seller_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const pendingApprovals = (pendingRes.data ??
    []) as unknown as PendingAuctionItem[];

  const active = (activeRes.data ??
    []) as unknown as TransactionWithRelations[];
  const completed = (completedRes.data ??
    []) as unknown as TransactionWithRelations[];

  // Transaksi yang menunggu aksi middleman (konfirmasi pembayaran / lepas dana)
  const needsAction = active.filter(
    (t) => t.status === "awaiting_payment" || t.status === "delivery_confirmed",
  ).length;

  const stats: {
    label: string;
    value: number;
    icon: typeof ClipboardCheck;
    tint: StatTint;
  }[] = [
    {
      label: "Perlu Persetujuan",
      value: pendingApprovals.length,
      icon: ClipboardCheck,
      tint: "blue",
    },
    {
      label: "Perlu Tindakan",
      value: needsAction,
      icon: Clock,
      tint: "amber",
    },
    {
      label: "Sedang Berjalan",
      value: active.length,
      icon: ClipboardList,
      tint: "blue",
    },
    {
      label: "Selesai",
      value: completed.length,
      icon: CheckCircle2,
      tint: "green",
    },
  ];

  return (
    <>
      <MobileBackBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg shadow-teal-600/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Dashboard Middleman
              </h1>
              <p className="text-sm text-gray-500">
                Kelola dan konfirmasi transaksi yang Anda tangani
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide text-green-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Middleman Terverifikasi
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <StatTile
              key={s.label}
              icon={s.icon}
              value={s.value}
              label={s.label}
              tint={s.tint}
            />
          ))}
        </div>

        {/* Lelang menunggu persetujuan */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-bold tracking-tight text-gray-900">
              Lelang Menunggu Persetujuan
            </h2>
            <span className="text-sm text-gray-500">
              {pendingApprovals.length} menunggu
            </span>
          </div>
          <PendingAuctionList auctions={pendingApprovals} />
        </section>

        {/* Transaksi aktif */}
        <section>
          <h2 className="text-[17px] font-bold tracking-tight text-gray-900 mb-3">
            Transaksi Aktif
          </h2>
          {active.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <ShieldCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Belum ada transaksi yang perlu Anda tangani
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={user.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Riwayat selesai */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-[17px] font-bold tracking-tight text-gray-900 mb-3">
              Riwayat Selesai
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completed.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </section>
        )}

        <Link
          href={`/profile/${user.username}`}
          className="text-sm text-gray-500 hover:text-gray-700 self-start"
        >
          ← Kembali ke profil
        </Link>
      </div>
    </>
  );
}
