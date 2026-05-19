import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { containsProfanity } from "@/lib/profanity";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (containsProfanity(body.title ?? "")) {
    return NextResponse.json(
      { error: "Judul lelang mengandung kata yang tidak pantas." },
      { status: 400 }
    );
  }

  // Validate buy_now_price > starting_price
  if (body.buy_now_price != null && body.buy_now_price <= body.starting_price) {
    return NextResponse.json(
      { error: "Harga Buy Now harus lebih tinggi dari harga mulai." },
      { status: 400 }
    );
  }

  // Validate max auction duration: 14 days
  if (body.end_time) {
    const start = body.start_time ? new Date(body.start_time) : new Date();
    const end = new Date(body.end_time);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 14) {
      return NextResponse.json(
        { error: "Durasi lelang maksimal 2 minggu (14 hari)." },
        { status: 400 }
      );
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "Waktu selesai harus setelah waktu mulai." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("auctions")
    .insert({
      seller_id: user.id,
      title: body.title,
      description: body.description ?? null,
      category_id: body.category_id,
      condition: body.condition,
      starting_price: body.starting_price,
      current_price: body.current_price,
      buy_now_price: body.buy_now_price ?? null,
      min_bid_increment: body.min_bid_increment ?? 1000,
      images: body.images ?? [],
      status: body.status ?? "draft",
      start_time: body.start_time ?? null,
      end_time: body.end_time,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
