import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Rating harus antara 1 sampai 5." },
      { status: 400 },
    );
  }
  const { rating, comment } = parsed.data;

  const { data: transaction, error: fetchErr } = await supabase
    .from("transactions")
    .select("id, auction_id, seller_id, buyer_id, status, receipt_photo_url")
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
      { error: "Hanya pembeli yang bisa memberi ulasan" },
      { status: 403 },
    );
  }

  if (transaction.status !== "completed") {
    return NextResponse.json(
      { error: "Ulasan hanya bisa diberikan setelah transaksi selesai." },
      { status: 400 },
    );
  }

  const { error: insertErr } = await supabase.from("reviews").insert({
    transaction_id: transaction.id,
    auction_id: transaction.auction_id,
    seller_id: transaction.seller_id,
    buyer_id: user.id,
    rating,
    comment: comment || null,
    // Snapshot the buyer's receipt photo so it can be shown publicly without
    // depending on the transactions table RLS.
    receipt_photo_url: transaction.receipt_photo_url ?? null,
  });

  if (insertErr) {
    // 23505 = unique_violation on (transaction_id): already reviewed.
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "Anda sudah memberi ulasan untuk transaksi ini." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Gagal menyimpan ulasan." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
