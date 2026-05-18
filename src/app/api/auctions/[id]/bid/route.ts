import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  const isBuyNow = !!body.buyNow;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Jumlah bid tidak valid" }, { status: 400 });
  }

  // Fetch auction
  const { data: auction, error: auctionError } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return NextResponse.json({ error: "Lelang tidak ditemukan" }, { status: 404 });
  }

  if (auction.status !== "active") {
    return NextResponse.json({ error: "Lelang sudah tidak aktif" }, { status: 400 });
  }

  if (auction.seller_id === user.id) {
    return NextResponse.json({ error: "Penjual tidak bisa bid di lelang sendiri" }, { status: 400 });
  }

  // Check buyer timeout
  const { data: profile } = await supabase
    .from("profiles")
    .select("buyer_timeout_until")
    .eq("id", user.id)
    .single();

  if (profile?.buyer_timeout_until && new Date(profile.buyer_timeout_until) > new Date()) {
    const until = new Date(profile.buyer_timeout_until).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
    return NextResponse.json(
      { error: `Akun Anda sedang dalam masa timeout hingga ${until}. Tidak dapat melakukan bid saat ini.` },
      { status: 403 }
    );
  }

  // Check end time
  if (auction.end_time && new Date(auction.end_time) < new Date()) {
    await supabase
      .from("auctions")
      .update({ status: "closed" })
      .eq("id", auctionId);
    // Notify seller and winner (idempotent via UNIQUE constraint)
    await createNotification(supabase, { user_id: auction.seller_id, type: "auction_ended", auction_id: auctionId });
    if (auction.winner_id) {
      await createNotification(supabase, { user_id: auction.winner_id, type: "auction_won", auction_id: auctionId });
    }
    return NextResponse.json({ error: "Lelang sudah berakhir" }, { status: 400 });
  }

  if (isBuyNow) {
    if (!auction.buy_now_price) {
      return NextResponse.json({ error: "Tidak ada harga Buy Now" }, { status: 400 });
    }

    // Place winning bid and close auction
    await supabase.from("bids").update({ is_winning: false }).eq("auction_id", auctionId);
    await supabase.from("bids").insert({
      auction_id: auctionId,
      bidder_id: user.id,
      amount: auction.buy_now_price,
      is_winning: true,
    });
    await supabase
      .from("auctions")
      .update({
        current_price: auction.buy_now_price,
        status: "completed",
        winner_id: user.id,
      })
      .eq("id", auctionId);

    // Notify seller and buyer
    await createNotification(supabase, { user_id: auction.seller_id, type: "auction_ended", auction_id: auctionId });
    await createNotification(supabase, { user_id: user.id, type: "auction_won", auction_id: auctionId });

    return NextResponse.json({ success: true });
  }

  // Regular bid validation
  const minBid = auction.current_price + auction.min_bid_increment;
  if (amount < minBid) {
    return NextResponse.json(
      { error: `Bid minimum adalah ${minBid.toLocaleString("id-ID")}` },
      { status: 400 }
    );
  }

  // Mark previous winning bid as non-winning
  await supabase
    .from("bids")
    .update({ is_winning: false })
    .eq("auction_id", auctionId)
    .eq("is_winning", true);

  // Insert new bid
  const { error: bidError } = await supabase.from("bids").insert({
    auction_id: auctionId,
    bidder_id: user.id,
    amount,
    is_winning: true,
  });

  if (bidError) {
    return NextResponse.json({ error: "Gagal memasang bid" }, { status: 500 });
  }

  // Update auction current price
  await supabase
    .from("auctions")
    .update({ current_price: amount, winner_id: user.id })
    .eq("id", auctionId);

  return NextResponse.json({ success: true });
}
