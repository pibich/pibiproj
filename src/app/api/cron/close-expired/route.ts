import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import type { Database } from "@/types/supabase";

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

  const { data: expiredAuctions, error } = await db
    .from("auctions")
    .select("id, seller_id, winner_id")
    .eq("status", "active")
    .lt("end_time", now);

  if (error || !expiredAuctions?.length) {
    return NextResponse.json({ closed: 0 });
  }

  const confirmationDeadline = new Date(
    Date.now() + 16 * 60 * 60 * 1000,
  ).toISOString();

  const ids = expiredAuctions.map((a) => a.id);
  // Auctions with a winner get a 16-hour confirmation deadline
  const withWinner = expiredAuctions.filter((a) => a.winner_id).map((a) => a.id);
  const withoutWinner = expiredAuctions.filter((a) => !a.winner_id).map((a) => a.id);

  if (withWinner.length) {
    await db
      .from("auctions")
      .update({ status: "closed", confirmation_deadline: confirmationDeadline })
      .in("id", withWinner);
  }
  if (withoutWinner.length) {
    await db.from("auctions").update({ status: "closed" }).in("id", withoutWinner);
  }

  for (const auction of expiredAuctions) {
    await createNotification(db, {
      user_id: auction.seller_id,
      type: "auction_ended",
      auction_id: auction.id,
    });
    if (auction.winner_id) {
      await createNotification(db, {
        user_id: auction.winner_id,
        type: "auction_won",
        auction_id: auction.id,
      });
    }
  }

  return NextResponse.json({ closed: ids.length });
}
