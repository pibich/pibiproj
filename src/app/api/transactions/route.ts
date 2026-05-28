import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `*,
      auction:auctions(id, title, images),
      seller:profiles!seller_id(id, username, name),
      buyer:profiles!buyer_id(id, username, name),
      middleman:profiles!middleman_id(id, username, name)`,
    )
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id},middleman_id.eq.${user.id}`)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }

  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { auction_id, middleman_id, tax_bearer, stream_channel_id } = body;

  if (!auction_id) {
    return NextResponse.json({ error: "auction_id diperlukan" }, { status: 400 });
  }

  // Ambil data lelang
  const { data: auction, error: auctionErr } = await supabase
    .from("auctions")
    .select("id, title, seller_id, winner_id, current_price, status")
    .eq("id", auction_id)
    .single();

  if (auctionErr || !auction) {
    return NextResponse.json({ error: "Lelang tidak ditemukan" }, { status: 404 });
  }

  if (!["closed", "completed"].includes(auction.status)) {
    return NextResponse.json({ error: "Lelang belum selesai" }, { status: 400 });
  }

  if (!auction.winner_id) {
    return NextResponse.json({ error: "Lelang belum memiliki pemenang" }, { status: 400 });
  }

  // Hanya seller atau buyer yang bisa membuat transaksi
  if (user.id !== auction.seller_id && user.id !== auction.winner_id) {
    return NextResponse.json({ error: "Anda bukan seller atau buyer lelang ini" }, { status: 403 });
  }

  // Cek apakah transaksi sudah ada untuk lelang ini
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("auction_id", auction_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Transaksi untuk lelang ini sudah ada" }, { status: 409 });
  }

  // Validasi middleman
  if (middleman_id) {
    const { data: mm } = await supabase
      .from("profiles")
      .select("is_middleman")
      .eq("id", middleman_id)
      .single();
    if (!mm?.is_middleman) {
      return NextResponse.json({ error: "User yang dipilih bukan middleman" }, { status: 400 });
    }
  }

  const { data: transaction, error: insertErr } = await supabase
    .from("transactions")
    .insert({
      auction_id,
      seller_id: auction.seller_id,
      buyer_id: auction.winner_id,
      middleman_id: middleman_id ?? null,
      amount: auction.current_price,
      tax_bearer: tax_bearer ?? "Buyer",
      stream_channel_id: stream_channel_id ?? null,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }

  // Notifikasi ke middleman jika ada
  if (middleman_id) {
    await createNotification(supabase, {
      user_id: middleman_id,
      type: "transaction_confirmed",
      auction_id,
    });
  }

  return NextResponse.json({ transaction }, { status: 201 });
}
