import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) return NextResponse.json({ users: [] });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, is_middleman")
    .neq("id", user.id)
    .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(10)
    .order("name");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [] });
}
