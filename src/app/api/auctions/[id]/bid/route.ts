import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

function getAdminClient() {
  return createSupabaseAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auctionId } = await params;

  // Use SSR client only to verify the user's session cookie
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  const isBuyNow = !!body.buyNow;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Jumlah bid tidak valid" },
      { status: 400 },
    );
  }

  // All DB operations use the admin client (service role — bypasses RLS)
  const db = getAdminClient();

  const { data: auction, error: auctionError } = await db
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return NextResponse.json(
      { error: "Lelang tidak ditemukan" },
      { status: 404 },
    );
  }

  if (auction.status !== "active") {
    return NextResponse.json(
      { error: "Lelang sudah tidak aktif" },
      { status: 400 },
    );
  }

  if (auction.seller_id === user.id) {
    return NextResponse.json(
      { error: "Penjual tidak bisa bid di lelang sendiri" },
      { status: 400 },
    );
  }

  // Check buyer timeout
  const { data: profile } = await db
    .from("profiles")
    .select("buyer_timeout_until")
    .eq("id", user.id)
    .single();

  if (
    profile?.buyer_timeout_until &&
    new Date(profile.buyer_timeout_until) > new Date()
  ) {
    const until = new Date(profile.buyer_timeout_until).toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
    return NextResponse.json(
      { error: `Akun Anda sedang dalam masa timeout hingga ${until}.` },
      { status: 403 },
    );
  }

  // Close auction if end_time already passed
  if (auction.end_time && new Date(auction.end_time) < new Date()) {
    const deadline = auction.winner_id
      ? new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString()
      : null;
    await db
      .from("auctions")
      .update({ status: "closed", confirmation_deadline: deadline })
      .eq("id", auctionId);
    await createNotification(db, {
      user_id: auction.seller_id,
      type: "auction_ended",
      auction_id: auctionId,
    });
    if (auction.winner_id) {
      await createNotification(db, {
        user_id: auction.winner_id,
        type: "auction_won",
        auction_id: auctionId,
      });
    }
    return NextResponse.json(
      { error: "Lelang sudah berakhir" },
      { status: 400 },
    );
  }

  // Get actual highest bid to prevent race conditions between simultaneous bids
  const { data: highestBidRow } = await db
    .from("bids")
    .select("amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const actualHighestBid = Math.max(
    auction.current_price,
    highestBidRow?.amount ?? 0,
  );

  if (isBuyNow) {
    if (!auction.buy_now_price) {
      return NextResponse.json(
        { error: "Tidak ada harga Buy Now" },
        { status: 400 },
      );
    }

    await db
      .from("bids")
      .update({ is_winning: false })
      .eq("auction_id", auctionId);
    await db.from("bids").insert({
      auction_id: auctionId,
      bidder_id: user.id,
      amount: auction.buy_now_price,
      is_winning: true,
    });

    const buyNowDeadline = new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString();
    const { data: closed, error: closeError } = await db
      .from("auctions")
      .update({
        current_price: auction.buy_now_price,
        status: "completed",
        winner_id: user.id,
        confirmation_deadline: buyNowDeadline,
      })
      .eq("id", auctionId)
      .select("id, status")
      .single();

    if (closeError || closed?.status !== "completed") {
      console.error("[buy-now] Failed to close auction:", closeError);
      return NextResponse.json(
        { error: "Gagal menutup lelang" },
        { status: 500 },
      );
    }

    await createNotification(db, {
      user_id: auction.seller_id,
      type: "auction_ended",
      auction_id: auctionId,
    });
    await createNotification(db, {
      user_id: user.id,
      type: "auction_won",
      auction_id: auctionId,
    });

    return NextResponse.json({ success: true });
  }

  // Regular bid: must exceed current highest by at least min_bid_increment
  const minBid = actualHighestBid + auction.min_bid_increment;
  if (amount < minBid) {
    return NextResponse.json(
      {
        error: `Bid minimum adalah ${minBid.toLocaleString("id-ID")}. Bid harus lebih tinggi dari bid tertinggi saat ini.`,
      },
      { status: 400 },
    );
  }

  await db
    .from("bids")
    .update({ is_winning: false })
    .eq("auction_id", auctionId)
    .eq("is_winning", true);

  const { error: bidError } = await db.from("bids").insert({
    auction_id: auctionId,
    bidder_id: user.id,
    amount,
    is_winning: true,
  });

  if (bidError) {
    return NextResponse.json({ error: "Gagal memasang bid" }, { status: 500 });
  }

  const { error: priceError } = await db
    .from("auctions")
    .update({ current_price: amount, winner_id: user.id })
    .eq("id", auctionId);

  if (priceError) {
    return NextResponse.json(
      { error: "Gagal memperbarui harga lelang" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
