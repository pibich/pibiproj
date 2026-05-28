import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  const { auctionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("auction_id", auctionId)
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id},middleman_id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }

  return NextResponse.json({ transaction: transaction ?? null });
}
