// ─────────────────────────────────────────────────────────────────────────────
// API: GET /api/middlemen  —  Daftar semua middleman terdaftar
// ─────────────────────────────────────────────────────────────────────────────
// Dipakai di beberapa tempat fitur middleman:
//   - MiddlemanModal      : menampilkan pilihan middleman yang bisa diundang.
//   - CustomChannelHeader : mengecek apakah salah satu member channel adalah
//     middleman (untuk menampilkan banner "Middleman aktif" + tombol Form).
//
// Middleman = user biasa di tabel `profiles` yang ditandai is_middleman = true.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Ambil hanya profil yang berperan sebagai middleman, urut berdasarkan nama.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url")
    .eq("is_middleman", true)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ middlemen: data ?? [] });
}
