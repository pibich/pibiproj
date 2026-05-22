import { NextResponse } from "next/server";
import { getStreamServerClient } from "@/lib/stream/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, buyer_warning_count")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const streamClient = getStreamServerClient();

  // Sync profile to Stream — fire-and-forget so a slow/timeout response from
  // Stream's API doesn't block token generation (createToken is local JWT signing)
  streamClient
    .upsertUser({
      id: profile.id,
      name: profile.name,
      username: profile.username,
      image: profile.avatar_url ?? undefined,
      buyer_warning_count: profile.buyer_warning_count,
    })
    .catch(console.error);

  const token = streamClient.createToken(profile.id);

  return NextResponse.json({
    token,
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    userId: profile.id,
    userName: profile.name,
    userImage: profile.avatar_url,
  });
}
