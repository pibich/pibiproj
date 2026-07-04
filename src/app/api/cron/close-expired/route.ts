// ─────────────────────────────────────────────────────────────────────────────
// CRON JOB: GET /api/cron/close-expired  —  Menutup lelang yang sudah berakhir
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint ini TIDAK dipanggil oleh user, melainkan oleh scheduler (cron) yang
// memanggilnya secara otomatis dan berkala (mis. tiap beberapa menit).
//
// Tugasnya: mencari lelang yang waktunya sudah lewat tapi statusnya masih
// "active", lalu menutupnya ("closed") dan mengirim notifikasi ke penjual &
// pemenang. Inilah yang membuat lelang "selesai sendiri" tanpa intervensi manual.
//
// Catatan penjadwalan: jadwal cron dikonfigurasi di luar kode ini (Vercel Cron /
// scheduler eksternal) yang memanggil URL dengan header:
//   Authorization: Bearer <CRON_SECRET>

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import type { Database } from "@/types/supabase";

// Client Supabase dengan SERVICE ROLE KEY = hak penuh (bypass aturan RLS).
// Diperlukan karena cron berjalan tanpa user login, jadi tidak bisa pakai sesi.
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  // 1) Keamanan: pastikan pemanggil adalah scheduler sah, bukan orang asing.
  //    Hanya request dengan token rahasia (CRON_SECRET) yang diterima.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminClient();
  const now = new Date().toISOString();

  // 2) Cari semua lelang yang masih "active" tetapi waktu berakhirnya (end_time)
  //    sudah lewat dari sekarang.
  const { data: expiredAuctions, error } = await db
    .from("auctions")
    .select("id, seller_id, winner_id")
    .eq("status", "active")
    .lt("end_time", now);

  // Tidak ada yang kedaluwarsa (atau error) -> selesai, 0 lelang ditutup.
  if (error || !expiredAuctions?.length) {
    return NextResponse.json({ closed: 0 });
  }

  // 3) Lelang yang ada pemenangnya diberi batas waktu konfirmasi 16 jam ke depan
  //    (waktu bagi pemenang untuk konfirmasi/membayar sebelum hangus).
  const confirmationDeadline = new Date(
    Date.now() + 16 * 60 * 60 * 1000,
  ).toISOString();

  const ids = expiredAuctions.map((a) => a.id);
  // 4) Pisahkan lelang menjadi dua kelompok berdasarkan ada/tidaknya pemenang.
  const withWinner = expiredAuctions.filter((a) => a.winner_id).map((a) => a.id);
  const withoutWinner = expiredAuctions.filter((a) => !a.winner_id).map((a) => a.id);

  // 4a) Ada pemenang -> tutup + set batas konfirmasi 16 jam.
  if (withWinner.length) {
    await db
      .from("auctions")
      .update({ status: "closed", confirmation_deadline: confirmationDeadline })
      .in("id", withWinner);
  }
  // 4b) Tanpa pemenang (tidak ada bid) -> cukup ditutup saja.
  if (withoutWinner.length) {
    await db.from("auctions").update({ status: "closed" }).in("id", withoutWinner);
  }

  // 5) Kirim notifikasi: penjual diberi tahu lelang berakhir; bila ada pemenang,
  //    pemenang diberi tahu bahwa ia menang.
  for (const auction of expiredAuctions) {
    await createNotification(db, {
      user_id: auction.seller_id,
      type: "auction_ended",
      auction_id: auction.id,
    });
    if (auction.winner_id) {
      await createNotification(db, {
        user_id: auction.winner_id,
        type: "auction_won",
        auction_id: auction.id,
      });
    }
  }

  // 6) Balas dengan jumlah lelang yang berhasil ditutup (untuk logging cron).
  return NextResponse.json({ closed: ids.length });
}
