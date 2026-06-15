import { ChevronDown, Clock, MessageCircle, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { ComplaintForm } from "@/components/contact/ComplaintForm";
import { MobileBackBar } from "@/components/layout/MobileBackBar";
import { buildWhatsAppUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Hubungi Kami" };

const faqs = [
  {
    q: "Bagaimana cara ikut lelang?",
    a: "Daftar akun, buka lelang yang kamu minati, lalu pasang tawaran di atas harga tertinggi. Saat hitung mundur berakhir, penawar tertinggi memenangkan lelang.",
  },
  {
    q: "Apa itu middleman dan kapan dipakai?",
    a: "Middleman adalah perantara tepercaya yang menahan pembayaran hingga kartu sampai dengan aman. Cocok dipakai untuk transaksi bernilai tinggi atau saat kamu ingin jaminan ekstra.",
  },
  {
    q: "Bagaimana jika kartu tidak sesuai deskripsi?",
    a: "Jangan konfirmasi transaksi. Laporkan lewat tombol Laporkan atau hubungi CS — dana yang ditahan middleman tidak akan diteruskan ke penjual sebelum masalah selesai.",
  },
  {
    q: "Berapa biaya pasang lelang?",
    a: "Membuat lelang gratis. Biaya hanya berlaku untuk layanan middleman opsional, sesuai kesepakatan antara pembeli dan penjual.",
  },
  {
    q: "Berapa lama lelang ditinjau sebelum tayang?",
    a: "Lelang baru biasanya ditinjau admin dalam hitungan menit hingga beberapa jam pada jam kerja sebelum tayang ke publik.",
  },
];

function formatPhone(raw: string): string {
  const m = raw.match(/^(\d{2})(\d{3})(\d{4})(\d+)$/);
  return m ? `+${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${raw}`;
}

export default async function ContactPage() {
  const csPhone = process.env.NEXT_PUBLIC_CS_WHATSAPP ?? "6281234567890";

  return (
    <>
      <MobileBackBar />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        {/* Heading */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
            <span className="h-px w-8 bg-teal-600" />
            Pusat Bantuan
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Ada kendala? Kami bantu.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Hubungi tim CS untuk laporan transaksi, kendala lelang, atau
            pertanyaan umum. Kami biasanya membalas dalam hitungan menit di jam
            kerja.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* WhatsApp */}
          <div className="flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  WhatsApp CS
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Jalur tercepat untuk laporan &amp; kendala mendesak.
                </p>
              </div>
            </div>
            <p className="font-mono text-xl font-bold tracking-tight text-slate-900">
              {formatPhone(csPhone)}
            </p>
            <a
              href={buildWhatsAppUrl(
                csPhone,
                "Halo, saya membutuhkan bantuan mengenai TCG Auction.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-teal-600 py-3.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-700"
            >
              <MessageCircle className="h-5 w-5" />
              Chat via WhatsApp
            </a>
          </div>

          {/* Operating hours */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Jam Operasional
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Tim CS siap membantu setiap hari.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Senin – Jumat</span>
                <span className="font-mono font-semibold text-slate-900">
                  09.00 – 21.00
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Sabtu – Minggu</span>
                <span className="font-mono font-semibold text-slate-900">
                  10.00 – 18.00
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500" />
              Online — rata-rata balas &lt; 10 menit
            </div>
          </div>
        </div>

        {/* Report form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kirim Laporan / Pertanyaan
              </h2>
              <p className="text-sm text-slate-500">
                Isi formulir, kami teruskan ke CS lewat WhatsApp.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <ComplaintForm csPhone={csPhone} />
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900">
            Pertanyaan Umum
          </h2>
          <div className="flex flex-col gap-2.5">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-slate-900 transition-colors hover:bg-slate-50">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
