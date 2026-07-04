# Handoff untuk Claude Chat — Dokumentasi Fitur Aplikasi Lelang

> Salin-tempel seluruh isi file ini ke Claude chat (claude.ai). Ini berisi konteks
> lengkap tentang 5 sistem inti aplikasi, sehingga Claude bisa membantu Anda
> menyusunnya menjadi bagian laporan/skripsi tanpa perlu mengakses kode.

## Konteks proyek
Aplikasi web **marketplace lelang** (auction) dibangun dengan:
- **Next.js** (App Router, TypeScript) — frontend + API routes.
- **Supabase** — database Postgres, autentikasi, dan Realtime (subscribe perubahan data).
- **GetStream** — layanan chat real-time.

Di bawah ini penjelasan 5 sistem inti beserta alur kerja dan poin teknisnya.

---

## 1. Menampilkan Card Post Lelang
Komponen `AuctionCard` merender tiap lelang sebagai kartu yang menaut ke halaman detail.

Poin penting:
- **Countdown**: sisa waktu diperbarui tiap 1 detik (`setInterval`). Jika sisa < 1 jam, badge berubah merah dan diberi label "Hot".
- **Real-time status**: kartu subscribe perubahan baris tabel `auctions` lewat Supabase Realtime, jadi status ("Selesai"/"Gagal") langsung berubah tanpa refresh halaman.
- Menampilkan: kondisi barang (mint, near mint, dst. dengan titik warna), harga tawaran tertinggi, harga "Beli Langsung" (opsional), badge "Gratis" ongkir, jumlah tawaran, dan rating bintang penjual.

## 2. Sistem Transaksi Middleman (Escrow)
Middleman = pihak ketiga tepercaya yang menahan dana pembeli sampai barang diterima, baru melepaskannya ke penjual.

Alur:
1. **Undang middleman** — pengguna memilih middleman dari modal; middleman ditambahkan ke channel chat GetStream sehingga pembeli, penjual, dan middleman ada di satu ruang percakapan.
2. **Buat transaksi** — endpoint memvalidasi (lelang sudah selesai & ada pemenang, pemohon adalah penjual/pembeli, belum ada transaksi, middleman valid), lalu membuat baris transaksi.
3. **Siklus status** (berurutan):
   - `awaiting_payment` → pembeli bayar; **middleman** konfirmasi pembayaran diterima.
   - `awaiting_shipment` → **penjual** unggah bukti kirim + nomor resi.
   - `shipped` → **pembeli** konfirmasi/unggah bukti penerimaan.
   - `delivery_confirmed` → **middleman** verifikasi lalu lepaskan dana.
   - `completed` → selesai; statistik penjual & pembeli bertambah, pembeli bisa memberi ulasan.
4. **Direct deal** (tanpa middleman): langkah escrow dilewati, transaksi langsung selesai.
Setiap transisi status memicu **notifikasi** ke pihak terkait.

## 3. Sistem Ulasan
- Hanya **pembeli** yang bisa memberi ulasan, dan hanya setelah transaksi berstatus `completed`.
- Input divalidasi: rating bilangan bulat 1–5, komentar maksimal 1000 karakter.
- Ulasan disimpan ke tabel `reviews` beserta *snapshot* foto bukti penerimaan (agar bisa ditampilkan publik).
- Constraint `UNIQUE(transaction_id)` mencegah ulasan ganda.
- Tampilan profil penjual menunjukkan rata-rata rating, distribusi bintang 1–5 (bar persentase), daftar ulasan, dan lightbox foto bukti.

## 4. Sistem API GetStream (Chat)
Prinsip keamanan: **API secret hanya di server**; browser hanya memakai API key publik + token pengguna.
- **Server client**: koneksi GetStream sisi server dengan hak admin (key + secret), dibuat sebagai singleton.
- **Pengambilan token** (`POST /api/stream-token`): verifikasi login Supabase → ambil profil → sinkronkan profil ke GetStream (`upsertUser`) → buat token JWT (ditandatangani lokal dengan secret) → kirim token + API key ke browser.
- **Buat channel/grup** (`POST /api/stream/group`): membuat channel dan menambahkan anggota (`create()` lalu `addMembers()`). Untuk middleman, ketiga pihak masuk satu channel. Keamanan: pemohon wajib termasuk daftar member.

## 5. Sistem Notifikasi
- Notifikasi disimpan di tabel `notifications`, dikirim real-time via Supabase Realtime.
- Helper `createNotification` menyisipkan satu baris; tipe terbatas (mis. `auction_won`, `transaction_confirmed`, `funds_released`, `auction_approved`). Constraint `UNIQUE(user_id, type, auction_id)` mencegah duplikat.
- `GET /api/notifications` mengambil 20 notifikasi terbaru + relasi lelang, dan menghitung jumlah belum dibaca.
- Komponen "lonceng" (`NotificationBell`): ambil data awal via REST, lalu subscribe event `INSERT` tabel `notifications` (difilter per `user_id`) → notifikasi baru langsung muncul & badge bertambah. Saat dropdown dibuka, ditandai sudah dibaca.

---

## Permintaan ke Claude Chat (ubah sesuai kebutuhan)
> Berdasarkan dokumentasi 5 sistem di atas, tolong bantu saya menuliskannya menjadi
> bagian **Bab [Implementasi / Perancangan Sistem]** laporan skripsi saya dengan
> gaya bahasa akademis formal (Bahasa Indonesia). Untuk tiap sistem, buat:
> (a) paragraf penjelasan alur kerja, dan (b) usulan diagram (mis. flowchart /
> sequence diagram) bila relevan. Sertakan juga kalimat pengantar dan penutup
> tiap subbab.
