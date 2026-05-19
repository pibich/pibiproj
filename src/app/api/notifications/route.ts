import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type NotificationWithAuction = Database["public"]["Tables"]["notifications"]["Row"] & {
  auction: { id: string; title: string } | null;
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*, auction:auctions(id, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Gagal memuat notifikasi" }, { status: 500 });
  }

  const notifList = (notifications as NotificationWithAuction[] | null) ?? [];
  const unread_count = notifList.filter((n) => !n.is_read).length;

  return NextResponse.json({ notifications: notifList, unread_count });
}
