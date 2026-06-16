import type { Metadata } from "next";
import {
  type PendingAuctionItem,
  PendingAuctionList,
} from "@/components/admin/PendingAuctionList";
import { getUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin - Persetujuan Lelang" };

const SELECT =
  "id, title, images, starting_price, current_price, created_at, end_time, seller:profiles!seller_id(username, name), category:categories(name)";

export default async function AdminApprovalsPage() {
  const admin = await getUser();
  const adminDb = createAdminClient();
  let query = adminDb
    .from("auctions")
    .select(SELECT)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  // An admin doesn't review their own auction submission — that already lives
  // in their profile's "menunggu persetujuan". Keep this queue to other
  // people's auctions so the same item isn't handled in two places.
  if (admin) query = query.neq("seller_id", admin.id);

  const { data } = await query;

  const pending = (data ?? []) as unknown as PendingAuctionItem[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight text-gray-900">
          Lelang Menunggu Persetujuan
        </h2>
        <span className="text-sm text-gray-500">{pending.length} menunggu</span>
      </div>
      <PendingAuctionList auctions={pending} />
    </div>
  );
}
