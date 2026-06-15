import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Seller-initiated failure: the winner never paid / disappeared. The seller
 * files a report against the winner and the auction is marked as failed
 * (status "closed" with the winner cleared, so it surfaces as "Gagal"). There
 * is no automatic warning system — moderation acts on the report manually.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auctionId } = await params;

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let description: string | null = null;
  try {
    const body = await req.json();
    description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  } catch {
    // no body is fine
  }

  const db = createAdminClient();

  const { data: auction, error: auctionError } = await db
    .from("auctions")
    .select("id, seller_id, winner_id, status, transaction_confirmed")
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
      { error: "Hanya penjual yang dapat menggagalkan lelang ini" },
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
      { error: "Transaksi sudah dikonfirmasi, tidak bisa digagalkan" },
      { status: 400 },
    );
  }

  // If a transaction already exists, the parties are already transacting —
  // disputes there go through the normal report/moderation flow instead.
  const { data: existingTx } = await db
    .from("transactions")
    .select("id")
    .eq("auction_id", auctionId)
    .maybeSingle();

  if (existingTx) {
    return NextResponse.json(
      {
        error:
          "Transaksi untuk lelang ini sudah berjalan. Gunakan menu laporan jika ada masalah.",
      },
      { status: 400 },
    );
  }

  const winnerId = auction.winner_id;

  // 1. File a report against the winner (manual moderation trail).
  await db.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: winnerId,
    auction_id: auctionId,
    reason: "no_payment",
    description,
  });

  // 2. Mark the auction as failed: clear the winner and keep it closed so it
  //    shows up as "Gagal" everywhere.
  const { error: updateError } = await db
    .from("auctions")
    .update({ status: "closed", winner_id: null })
    .eq("id", auctionId);

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal memperbarui status lelang" },
      { status: 500 },
    );
  }

  // 3. Notify the former winner that the auction was failed.
  await createNotification(db, {
    user_id: winnerId,
    type: "confirmation_expired",
    auction_id: auctionId,
  });

  return NextResponse.json({ success: true });
}
