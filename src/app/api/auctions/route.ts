import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

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
