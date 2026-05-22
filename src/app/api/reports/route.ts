import { type NextRequest, NextResponse } from "next/server";
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
  const { reported_user_id, auction_id, reason, description } = body;

  if (!reported_user_id || !reason) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  if (reported_user_id === user.id) {
    return NextResponse.json(
      { error: "Tidak bisa melaporkan diri sendiri" },
      { status: 400 },
    );
  }

  const validReasons = [
    "bid_run",
    "seller_close_no_reason",
    "fraud",
    "scam",
    "no_payment",
    "other",
  ];
  if (!validReasons.includes(reason)) {
    return NextResponse.json({ error: "Alasan tidak valid" }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id,
    auction_id: auction_id ?? null,
    reason,
    description: description ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
