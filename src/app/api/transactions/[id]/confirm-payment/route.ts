import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

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

  const { data: transaction, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  if (transaction.middleman_id !== user.id) {
    return NextResponse.json({ error: "Hanya middleman yang bisa konfirmasi pembayaran" }, { status: 403 });
  }

  if (transaction.status !== "awaiting_payment") {
    return NextResponse.json({ error: `Status saat ini tidak valid: ${transaction.status}` }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from("transactions")
    .update({ status: "awaiting_shipment", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: "Gagal mengupdate status" }, { status: 500 });
  }

  // Notifikasi ke seller: pembayaran dikonfirmasi, silakan kirim
  await createNotification(supabase, {
    user_id: transaction.seller_id,
    type: "awaiting_shipment",
    auction_id: transaction.auction_id,
  });

  return NextResponse.json({ ok: true });
}
