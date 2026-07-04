// ─────────────────────────────────────────────────────────────────────────────
// GetStream — Server Client (sisi backend)
// ─────────────────────────────────────────────────────────────────────────────
// File ini membuat koneksi ke GetStream Chat dari SISI SERVER.
//
// Bedanya dengan client di browser:
//   - Server client memakai API KEY + API SECRET  -> punya hak penuh (admin):
//     boleh membuat token, membuat channel, menambah member, upsert user, dll.
//   - Browser client hanya memakai API KEY + token user -> hak terbatas.
//
// PENTING: STREAM_API_SECRET tidak boleh pernah bocor ke browser. Karena itu
// semua operasi yang butuh secret dijalankan lewat API route di server
// (lihat: /api/stream-token dan /api/stream/group).

import { StreamChat } from "stream-chat";

// Singleton: koneksi GetStream dibuat sekali lalu dipakai ulang di seluruh
// request. Ini menghindari pembuatan instance baru tiap kali endpoint dipanggil.
let client: StreamChat | null = null;

export function getStreamServerClient(): StreamChat {
  if (!client) {
    // getInstance(apiKey, apiSecret) -> membuat client dengan hak admin.
    // Tanda "!" memberitahu TypeScript bahwa env var dipastikan ada saat runtime.
    client = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!, // key publik (boleh ke browser)
      process.env.STREAM_API_SECRET!, // secret rahasia (HANYA di server)
    );
  }
  return client;
}
