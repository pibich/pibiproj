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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, reason } = body;

  if (!name || !reason) {
    return NextResponse.json({ error: "Nama dan alasan wajib diisi" }, { status: 400 });
  }

  // Check if a registered user matches email or phone
  let matchedUserId: string | null = null;
  if (email || phone) {
    const conditions: string[] = [];
    if (email) conditions.push(`email.eq.${email}`);
    if (phone) conditions.push(`phone.eq.${phone}`);

    const { data: matchedUser } = await supabase
      .from("profiles")
      .select("id")
      .or(conditions.join(","))
      .limit(1)
      .single();

    if (matchedUser) {
      matchedUserId = matchedUser.id;
    }
  }

  const { error } = await supabase.from("blacklist").insert({
    user_id: matchedUserId,
    name,
    email: email ?? null,
    phone: phone ?? null,
    reason,
    type: "manual",
    added_by_admin: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If user matched, deactivate their account
  if (matchedUserId) {
    await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", matchedUserId);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
