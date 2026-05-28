import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function PATCH(
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

  const adminClient = createAdminClient();

  const { data: admin } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    action: "approve" | "reject";
    admin_note?: string;
  };

  const { data: auction, error: fetchErr } = await adminClient
    .from("auctions")
    .select("id, seller_id, status")
    .eq("id", id)
    .single();

  if (fetchErr || !auction) {
    return NextResponse.json(
      { error: "Lelang tidak ditemukan" },
      { status: 404 },
    );
  }

  if (auction.status !== "pending_review") {
    return NextResponse.json(
      { error: "Hanya lelang berstatus pending_review yang dapat ditinjau" },
      { status: 400 },
    );
  }

  if (body.action === "approve") {
    const { error } = await adminClient
      .from("auctions")
      .update({ status: "active", admin_note: null })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createNotification(adminClient, {
      user_id: auction.seller_id,
      type: "auction_approved",
      auction_id: id,
    });

    return NextResponse.json({ success: true, status: "active" });
  }

  if (body.action === "reject") {
    const { error } = await adminClient
      .from("auctions")
      .update({
        status: "rejected",
        admin_note: body.admin_note ?? null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createNotification(adminClient, {
      user_id: auction.seller_id,
      type: "auction_rejected",
      auction_id: id,
    });

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
