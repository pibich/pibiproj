import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: transaction, error: fetchErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !transaction) {
    return NextResponse.json(
      { error: "Transaksi tidak ditemukan" },
      { status: 404 },
    );
  }

  if (transaction.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "Hanya buyer yang bisa konfirmasi penerimaan" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { receipt_photo_url, receipt_notes } = body;

  if (!receipt_photo_url) {
    return NextResponse.json(
      { error: "Foto bukti penerimaan wajib diupload" },
      { status: 400 },
    );
  }

  // Direct (non-middleman) transactions have no shipment tracking. The seller
  // confirms the deal directly (status already "completed"), so the buyer just
  // attaches the receipt proof without advancing any status.
  const isDirect = !transaction.middleman_id;

  if (isDirect) {
    if (transaction.status === "cancelled") {
      return NextResponse.json(
        { error: "Transaksi sudah dibatalkan" },
        { status: 400 },
      );
    }
    const { error: updateErr } = await supabase
      .from("transactions")
      .update({
        receipt_photo_url,
        receipt_notes: receipt_notes ?? null,
        receipt_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Gagal menyimpan bukti penerimaan" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (transaction.status !== "shipped") {
    return NextResponse.json(
      { error: `Status saat ini tidak valid: ${transaction.status}` },
      { status: 400 },
    );
  }

  const { error: updateErr } = await supabase
    .from("transactions")
    .update({
      status: "delivery_confirmed",
      receipt_photo_url,
      receipt_notes: receipt_notes ?? null,
      receipt_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Gagal mengupdate status" },
      { status: 500 },
    );
  }

  // Notifikasi ke middleman: buyer konfirmasi terima
  if (transaction.middleman_id) {
    await createNotification(supabase, {
      user_id: transaction.middleman_id,
      type: "delivery_confirmed",
      auction_id: transaction.auction_id,
    });
  }

  return NextResponse.json({ ok: true });
}
