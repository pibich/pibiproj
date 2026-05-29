import type { Metadata } from "next";
import {
  type PendingAuctionItem,
  PendingAuctionList,
} from "@/components/admin/PendingAuctionList";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin - Persetujuan Lelang" };

const SELECT =
  "id, title, images, starting_price, current_price, created_at, end_time, seller:profiles!seller_id(username, name), category:categories(name)";

export default async function AdminApprovalsPage() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("auctions")
    .select(SELECT)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  const pending = (data ?? []) as unknown as PendingAuctionItem[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Lelang Menunggu Persetujuan
        </h2>
        <span className="text-sm text-gray-500">{pending.length} menunggu</span>
      </div>
      <PendingAuctionList auctions={pending} />
    </div>
  );
}
