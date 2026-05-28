import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("transactions")
    .select("id, status, middleman_id, buyer_id, seller_id, amount")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  if (![data.middleman_id, data.buyer_id, data.seller_id].includes(user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ transaction: data });
}
