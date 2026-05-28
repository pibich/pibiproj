import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import type { Transaction } from "@/types/supabase";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rawTx, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  const transaction = rawTx as Transaction | null;

  if (fetchErr || !rawTx || !transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  if (transaction.middleman_id !== user.id) {
    return NextResponse.json({ error: "Hanya middleman yang bisa melepaskan dana" }, { status: 403 });
  }

  if (transaction.status !== "delivery_confirmed") {
    return NextResponse.json({ error: `Status saat ini tidak valid: ${transaction.status}` }, { status: 400 });
  }

  // Update transaksi ke completed
  const { error: updateErr } = await supabase
    .from("transactions")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: "Gagal mengupdate status transaksi" }, { status: 500 });
  }

  // Set auction.transaction_confirmed = true
  await supabase
    .from("auctions")
    .update({ transaction_confirmed: true })
    .eq("id", transaction.auction_id);

  // Increment successful_sales seller
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("successful_sales")
    .eq("id", transaction.seller_id)
    .single();

  await supabase
    .from("profiles")
    .update({ successful_sales: (sellerProfile?.successful_sales ?? 0) + 1 })
    .eq("id", transaction.seller_id);

  // Increment successful_purchases buyer
  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("successful_purchases")
    .eq("id", transaction.buyer_id)
    .single();

  await supabase
    .from("profiles")
    .update({ successful_purchases: (buyerProfile?.successful_purchases ?? 0) + 1 })
    .eq("id", transaction.buyer_id);

  // Notifikasi ke seller: dana dilepaskan
  await createNotification(supabase, {
    user_id: transaction.seller_id,
    type: "funds_released",
    auction_id: transaction.auction_id,
  });

  // Notifikasi ke buyer: transaksi selesai
  await createNotification(supabase, {
    user_id: transaction.buyer_id,
    type: "delivery_confirmed",
    auction_id: transaction.auction_id,
  });

  return NextResponse.json({ ok: true });
}
