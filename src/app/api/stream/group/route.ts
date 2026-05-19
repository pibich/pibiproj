import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStreamServerClient } from "@/lib/stream/client";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channelId, memberIds, name } = (await req.json()) as {
    channelId: string;
    memberIds: string[];
    name?: string;
  };

  if (!channelId || !Array.isArray(memberIds) || memberIds.length < 2) {
    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
  }

  // Ensure the requesting user is in the member list
  if (!memberIds.includes(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const streamClient = getStreamServerClient();

  const channel = streamClient.channel("messaging", channelId, {
    ...(name ? { name } : {}),
    created_by_id: user.id,
  });

  // create() initialises the channel; addMembers() is the explicit call that
  // actually registers member relationships — passing members in channel data
  // only stores them as custom fields in the node SDK, not as real memberships.
  await channel.create();
  await channel.addMembers(memberIds);

  return NextResponse.json({ channelId });
}
