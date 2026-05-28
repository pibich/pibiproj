import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
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

  if (transaction.seller_id !== user.id) {
    return NextResponse.json({ error: "Hanya seller yang bisa upload bukti pengiriman" }, { status: 403 });
  }

  if (transaction.status !== "awaiting_shipment") {
    return NextResponse.json({ error: `Status saat ini tidak valid: ${transaction.status}` }, { status: 400 });
  }

  const body = await req.json();
  const { shipping_photo_url, shipping_tracking_number, shipping_notes } = body;

  if (!shipping_photo_url || !shipping_tracking_number) {
    return NextResponse.json(
      { error: "Foto dan nomor resi wajib diisi" },
      { status: 400 },
    );
  }

  const { error: updateErr } = await supabase
    .from("transactions")
    .update({
      status: "shipped",
      shipping_photo_url,
      shipping_tracking_number,
      shipping_notes: shipping_notes ?? null,
      shipping_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: "Gagal mengupdate status" }, { status: 500 });
  }

  // Notifikasi ke buyer: paket sedang dikirim
  await createNotification(supabase, {
    user_id: transaction.buyer_id,
    type: "shipping_proof_submitted",
    auction_id: transaction.auction_id,
  });

  // Notifikasi ke middleman: seller upload bukti kirim
  if (transaction.middleman_id) {
    await createNotification(supabase, {
      user_id: transaction.middleman_id,
      type: "shipping_proof_submitted",
      auction_id: transaction.auction_id,
    });
  }

  return NextResponse.json({ ok: true });
}
