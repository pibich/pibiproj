import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { supabase, user, error: "Forbidden", status: 403 };

  return { supabase, user, error: null, status: 200 };
}

export async function GET() {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { data, error: dbError } = await supabase
    .from("blacklist")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { supabase, user, error, status } = await requireAdmin();
  if (error || !user) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const { name, username, email, phone, reason, added_by } = body;

  const { error: dbError } = await supabase.from("blacklist").insert({
    name: name || null,
    username: username || null,
    email: email || null,
    phone: phone || null,
    reason: reason || null,
    added_by: added_by ?? user.id,
    type: "manual",
  });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
