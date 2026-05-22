import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _: Request,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get blacklist entry to check if we need to re-activate user
  const { data: entry } = await supabase
    .from("blacklist")
    .select("user_id, type")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("blacklist").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Re-activate user if this was the only blacklist entry (manual type)
  if (entry?.user_id && entry.type === "manual") {
    const { data: remaining } = await supabase
      .from("blacklist")
      .select("id")
      .eq("user_id", entry.user_id);

    if (!remaining || remaining.length === 0) {
      await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", entry.user_id);
    }
  }

  return NextResponse.json({ success: true });
}
