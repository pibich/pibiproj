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

  const [activeRes, completedRes, pendingRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(SELECT)
      .eq("middleman_id", user.id)
      .not("status", "in", '("completed","cancelled")')
      .order("updated_at", { ascending: false }),
    supabase
      .from("transactions")
      .select(SELECT)
      .eq("middleman_id", user.id)
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(20),
    adminDb
      .from("auctions")
      .select(
        "id, title, images, starting_price, current_price, created_at, end_time, seller:profiles!seller_id(username, name), category:categories(name)",
      )
      .eq("status", "pending_approval")
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

  const stats = [
    {
      label: "Perlu Persetujuan",
      value: pendingApprovals.length,
      icon: ClipboardCheck,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Perlu Tindakan",
      value: needsAction,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Sedang Berjalan",
      value: active.length,
      icon: ClipboardList,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Selesai",
      value: completed.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <>
      <MobileBackBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Dashboard Middleman
            </h1>
            <p className="text-sm text-gray-500">
              Kelola dan konfirmasi transaksi yang Anda tangani
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}
              >
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {s.value}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lelang menunggu persetujuan */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
