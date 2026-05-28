import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import type { Database } from "@/types/supabase";

const CONFIRMATION_HOURS = 16;
const WARNING_NOTE = "Tidak mengkonfirmasi lelang ke seller dalam batas waktu yang ditentukan";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminClient();
  const now = new Date().toISOString();

  // Cari lelang yang:
  // - sudah closed/completed dengan winner
  // - belum transaction_confirmed
  // - confirmation_deadline sudah lewat
  // - belum ada transaksi aktif
  const { data: overdueAuctions, error } = await db
    .from("auctions")
    .select("id, title, seller_id, winner_id, confirmation_deadline")
    .in("status", ["closed", "completed"])
    .not("winner_id", "is", null)
    .not("confirmation_deadline", "is", null)
    .eq("transaction_confirmed", false)
    .lt("confirmation_deadline", now);

  if (error || !overdueAuctions?.length) {
    return NextResponse.json({ warned: 0 });
  }

  // Filter: hanya proses yang belum ada transaksi sama sekali
  const auctionIds = overdueAuctions.map((a) => a.id);
  const { data: existingTx } = await db
    .from("transactions")
    .select("auction_id")
    .in("auction_id", auctionIds);

  const txAuctionIds = new Set((existingTx ?? []).map((t) => t.auction_id));
  const toProcess = overdueAuctions.filter((a) => !txAuctionIds.has(a.id));

  if (!toProcess.length) {
    return NextResponse.json({ warned: 0 });
  }

  let warned = 0;

  for (const auction of toProcess) {
    if (!auction.winner_id) continue;

    // 1. Batalkan lelang
    await db
      .from("auctions")
      .update({ status: "cancelled" })
      .eq("id", auction.id);

    // 2. Ambil data buyer
    const { data: buyer } = await db
      .from("profiles")
      .select("buyer_warning_count")
      .eq("id", auction.winner_id)
      .single();

    const currentCount = buyer?.buyer_warning_count ?? 0;
    const newCount = currentCount + 1;

    // 3. Update warning count + timeout jika >= 3
    const profileUpdate: { buyer_warning_count: number; buyer_timeout_until?: string } = {
      buyer_warning_count: newCount,
    };
    if (newCount >= 3) {
      const until = new Date();
      until.setDate(until.getDate() + 7);
      profileUpdate.buyer_timeout_until = until.toISOString();
    }
    await db.from("profiles").update(profileUpdate).eq("id", auction.winner_id);

    // 4. Simpan catatan warning dengan note
    await db.from("buyer_warnings").insert({
      user_id: auction.winner_id,
      auction_id: auction.id,
      note: WARNING_NOTE,
      auto_generated: true,
    });

    // 5. Notifikasi ke buyer
    await createNotification(db, {
      user_id: auction.winner_id,
      type: "confirmation_expired",
      auction_id: auction.id,
    });

    // 6. Notifikasi ke seller (auction_ended sebagai sinyal lelang digagalkan)
    await createNotification(db, {
      user_id: auction.seller_id,
      type: "auction_ended",
      auction_id: auction.id,
    });

    warned++;
  }

  return NextResponse.json({
    warned,
    processed: toProcess.map((a) => a.id),
  });
}
