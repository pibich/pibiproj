import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auctionId } = await params;

  // SSR client for reading the user's session cookie
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin client (service role) for all DB writes — bypasses RLS reliably
  const db = createAdminClient();

  const { data: auction, error: auctionError } = await db
    .from("auctions")
    .select(
      "id, seller_id, winner_id, status, transaction_confirmed, title, current_price",
    )
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return NextResponse.json(
      { error: "Lelang tidak ditemukan" },
      { status: 404 },
    );
  }

  if (auction.seller_id !== user.id) {
    return NextResponse.json(
      { error: "Hanya penjual yang dapat mengkonfirmasi transaksi" },
      { status: 403 },
    );
  }

  if (auction.status !== "completed" && auction.status !== "closed") {
    return NextResponse.json(
      { error: "Lelang belum selesai" },
      { status: 400 },
    );
  }

  if (!auction.winner_id) {
    return NextResponse.json(
      { error: "Tidak ada pemenang untuk lelang ini" },
      { status: 400 },
    );
  }

  if (auction.transaction_confirmed) {
    return NextResponse.json(
      { error: "Transaksi sudah dikonfirmasi sebelumnya" },
      { status: 400 },
    );
  }

  const { error: updateError } = await db
    .from("auctions")
    .update({ transaction_confirmed: true })
    .eq("id", auctionId);

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal mengkonfirmasi transaksi" },
      { status: 500 },
    );
  }

  // Ensure a completed transaction row exists so the buyer can leave a review.
  // The direct (non-escrow) flow never creates a `transactions` row, but the
  // review API keys off a completed transaction — so we create/complete one here.
  const { data: existingTx } = await db
    .from("transactions")
    .select("id, status")
    .eq("auction_id", auctionId)
    .maybeSingle();

  if (existingTx) {
    if (existingTx.status !== "completed") {
      await db
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", existingTx.id);
    }
  } else {
    await db.from("transactions").insert({
      auction_id: auctionId,
      seller_id: auction.seller_id,
      buyer_id: auction.winner_id,
      amount: auction.current_price,
      status: "completed",
    });
  }

  // Increment successful_sales for seller
  const { data: sellerProfile } = await db
    .from("profiles")
    .select("successful_sales")
    .eq("id", auction.seller_id)
    .single();

  if (sellerProfile) {
    await db
      .from("profiles")
      .update({ successful_sales: (sellerProfile.successful_sales ?? 0) + 1 })
      .eq("id", auction.seller_id);
  }

  // Increment successful_purchases for buyer
  const { data: buyerProfile } = await db
    .from("profiles")
    .select("successful_purchases")
    .eq("id", auction.winner_id)
    .single();

  if (buyerProfile) {
    await db
      .from("profiles")
      .update({
        successful_purchases: (buyerProfile.successful_purchases ?? 0) + 1,
      })
      .eq("id", auction.winner_id);
  }

  await createNotification(db, {
    user_id: auction.seller_id,
    type: "transaction_confirmed",
    auction_id: auctionId,
  });
  await createNotification(db, {
    user_id: auction.winner_id,
    type: "transaction_confirmed",
    auction_id: auctionId,
  });

  return NextResponse.json({ success: true });
}
