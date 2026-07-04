// ─────────────────────────────────────────────────────────────────────────────
// API: POST /api/stream/group  —  Membuat channel chat (termasuk grup middleman)
// ─────────────────────────────────────────────────────────────────────────────
// Dipakai untuk membuat ruang percakapan di GetStream, lalu memasukkan anggota.
// Pada fitur middleman: pembeli, penjual, dan middleman dijadikan member dari
// satu channel yang sama sehingga bisa transaksi diawasi di satu tempat.
//
// Kenapa lewat server (bukan langsung dari browser)? Karena membuat channel &
// menambah member butuh hak admin (API secret), yang hanya boleh ada di server.

import { type NextRequest, NextResponse } from "next/server";
import { getStreamServerClient } from "@/lib/stream/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // 1) Pastikan user login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2) Baca data dari body request:
  //    - channelId : ID unik channel (dibuat dari gabungan ID semua member)
  //    - memberIds : daftar user yang akan jadi anggota (min. 2 orang)
  //    - name      : nama channel (opsional, biasanya untuk grup)
  const { channelId, memberIds, name } = (await req.json()) as {
    channelId: string;
    memberIds: string[];
    name?: string;
  };

  if (!channelId || !Array.isArray(memberIds) || memberIds.length < 2) {
    return NextResponse.json(
      { error: "Parameter tidak valid" },
      { status: 400 },
    );
  }

  // 3) Keamanan: user yang meminta WAJIB ada di daftar member. Mencegah orang
  //    membuat channel lalu menyusupkan dirinya ke percakapan orang lain.
  if (!memberIds.includes(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4) Buat channel via GetStream (hak admin dari server client).
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
