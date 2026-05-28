import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns auctions where the current user is seller or winner,
// auction is closed/completed, has a winner, and no transaction exists yet.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  type AuctionRow = {
    id: string;
    title: string;
    current_price: number;
    images: string[] | null;
    seller_id: string;
    winner_id: string | null;
    status: string;
    seller: { username: string; name: string } | null;
    winner: { username: string; name: string } | null;
  };

  const { data: rawAuctions, error } = await supabase
    .from("auctions")
    .select("id, title, current_price, images, seller_id, winner_id, status, seller:profiles!seller_id(username, name), winner:profiles!winner_id(username, name)")
    .or(`seller_id.eq.${user.id},winner_id.eq.${user.id}`)
    .in("status", ["closed", "completed"])
    .not("winner_id", "is", null)
    .eq("transaction_confirmed", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  const auctions = (rawAuctions ?? []) as unknown as AuctionRow[];

  if (error) {
    return NextResponse.json({ error: "Gagal memuat lelang" }, { status: 500 });
  }

  // Filter out auctions that already have a transaction
  const auctionIds = auctions.map((a) => a.id);
  if (auctionIds.length === 0) {
    return NextResponse.json({ auctions: [] });
  }

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("auction_id")
    .in("auction_id", auctionIds);

  const txAuctionIds = new Set((existingTx ?? []).map((t) => t.auction_id));
  const eligible = auctions.filter((a) => !txAuctionIds.has(a.id));

  return NextResponse.json({ auctions: eligible });
}
