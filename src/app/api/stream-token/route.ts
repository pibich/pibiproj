// ─────────────────────────────────────────────────────────────────────────────
// API: POST /api/stream-token  —  "Pintu masuk" chat (pengambilan token GetStream)
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint inilah inti dari "metode pengambilan API GetStream".
//
// Alur singkat (dipanggil oleh ChatWidget & hook useChatUnread di browser):
//   1. Pastikan user benar-benar login (cek sesi Supabase).
//   2. Ambil data profil user dari database (nama, username, avatar, dll).
//   3. Sinkronkan profil itu ke GetStream (upsertUser) supaya nama/foto di chat
//      selalu sama dengan database kita.
//   4. Buat TOKEN GetStream untuk user tsb, lalu kirim token + API key ke browser.
//
// Token = "tiket" yang dipakai browser untuk connect ke GetStream secara aman
// TANPA pernah menyentuh API secret. Token dibuat & ditandatangani di server.

import { NextResponse } from "next/server";
import { getStreamServerClient } from "@/lib/stream/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  // 1) Verifikasi sesi login. Hanya user terautentikasi yang boleh dapat token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Ambil profil dari tabel `profiles` untuk ditampilkan di chat.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url, buyer_warning_count")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // 3) Ambil koneksi GetStream sisi server (punya hak admin).
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

  // 4) Buat token untuk user ini. createToken() = penandatanganan JWT secara
  //    lokal memakai API secret -> cepat, tidak perlu memanggil server GetStream.
  const token = streamClient.createToken(profile.id);

  // Kirim token + API key (publik) ke browser. Browser memakai keduanya untuk
  // connectUser() ke GetStream (lihat ChatWidget.getOrConnectClient).
  return NextResponse.json({
    token,
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
    userId: profile.id,
    userName: profile.name,
    userImage: profile.avatar_url,
  });
}
