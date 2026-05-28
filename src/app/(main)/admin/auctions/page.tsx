import type { Metadata } from "next";
import {
  type AuctionQueueRow,
  AdminAuctionQueue,
} from "@/components/admin/AdminAuctionQueue";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin - Antrian Persetujuan Lelang" };

export default async function AdminAuctionsPage() {
  const db = createAdminClient();

  const { data: auctions } = await db
    .from("auctions")
    .select(
      "id, title, description, condition, images, starting_price, buy_now_price, end_time, created_at, seller:profiles!seller_id(username, name)",
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  const queue = (auctions ?? []) as AuctionQueueRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Antrian Persetujuan Lelang
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {queue.length} lelang menunggu persetujuan
          </p>
        </div>
      </div>
      <AdminAuctionQueue auctions={queue} />
    </div>
  );
}
