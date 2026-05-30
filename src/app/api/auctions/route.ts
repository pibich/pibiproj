import { type NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { containsProfanity } from "@/lib/profanity";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Block users who are in an active timeout from creating auctions
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("buyer_timeout_until")
    .eq("id", user.id)
    .single();

  if (
    sellerProfile?.buyer_timeout_until &&
    new Date(sellerProfile.buyer_timeout_until) > new Date()
  ) {
    const until = new Date(
      sellerProfile.buyer_timeout_until,
    ).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return NextResponse.json(
      { error: `Akun Anda sedang dalam masa timeout hingga ${until}.` },
      { status: 403 },
    );
  }

  const body = await req.json();

  if (containsProfanity(body.title ?? "")) {
    return NextResponse.json(
      { error: "Judul lelang mengandung kata yang tidak pantas." },
      { status: 400 },
    );
  }

  // Validate buy_now_price > starting_price
  if (body.buy_now_price != null && body.buy_now_price <= body.starting_price) {
    return NextResponse.json(
      { error: "Harga Buy Now harus lebih tinggi dari harga mulai." },
      { status: 400 },
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
        { status: 400 },
      );
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "Waktu selesai harus setelah waktu mulai." },
        { status: 400 },
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
      free_shipping: body.free_shipping ?? false,
      images: body.images ?? [],
      // Lelang baru wajib ditinjau admin/middleman sebelum tampil publik.
      // Draft (jika dipakai di masa depan) tetap dihormati; selain itu → pending.
      status: body.status === "draft" ? "draft" : "pending_approval",
      start_time: body.start_time ?? null,
      end_time: body.end_time,
    })
    .select("id, title, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Beri tahu semua admin & middleman bahwa ada lelang yang perlu disetujui.
  // Pakai service-role agar bisa membaca daftar approver & menulis notifikasi
  // untuk user lain tanpa terhalang RLS.
  if (data.status === "pending_approval") {
    try {
      const adminDb = createAdminClient();
      const { data: approvers } = await adminDb
        .from("profiles")
        .select("id")
        .or("role.eq.admin,is_middleman.eq.true")
        .neq("id", user.id);

      for (const approver of approvers ?? []) {
        await createNotification(adminDb, {
          user_id: approver.id,
          type: "auction_pending_approval",
          auction_id: data.id,
        });
      }
    } catch {
      // Notifikasi best-effort — kegagalan tidak membatalkan pembuatan lelang.
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
