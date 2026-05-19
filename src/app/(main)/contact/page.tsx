import type { Metadata } from "next";
import { buildWhatsAppUrl } from "@/lib/utils";
import { MessageCircle, Clock, Mail, ChevronDown } from "lucide-react";
import { ComplaintForm } from "@/components/contact/ComplaintForm";

export const metadata: Metadata = { title: "Hubungi Kami" };

const faqs = [
  {
    q: "Bagaimana cara melakukan bid?",
    a: "Buka halaman detail lelang, masukkan jumlah bid Anda (minimal harga saat ini + kenaikan minimum), lalu klik tombol 'Pasang Bid'.",
  },
  {
    q: "Apa itu sistem Blacklist?",
    a: "Sistem blacklist mencatat pengguna yang terbukti melanggar aturan (bid run, penipuan, dll.). Setelah 3 pelanggaran terkonfirmasi, akun diblacklist otomatis. Admin juga dapat menambah entri blacklist secara manual.",
  },
  {
    q: "Bagaimana cara melaporkan penjual/pembeli bermasalah?",
    a: "Kunjungi profil pengguna atau halaman detail lelang, lalu klik tombol 'Laporkan'. Pilih alasan dan berikan deskripsi kejadian. Tim admin akan meninjau laporan Anda.",
  },
  {
    q: "Bagaimana sistem pembayaran bekerja?",
    a: "TCG Marketplace menghubungkan pembeli dan penjual, tetapi tidak memproses pembayaran. Setelah lelang selesai, pembeli dan penjual mengatur pembayaran secara langsung.",
  },
  {
    q: "Apa yang terjadi jika pemenang lelang tidak membayar?",
    a: "Penjual dapat melaporkan pembeli. Jika laporan disetujui, pembeli mendapat pelanggaran. Setelah 3 pelanggaran, akun akan diblacklist otomatis.",
  },
  {
    q: "Berapa lama lelang bisa berlangsung?",
    a: "Penjual bebas menentukan durasi lelang saat membuat listing. Lelang otomatis ditutup saat waktu yang ditentukan berakhir.",
  },
];

export default async function ContactPage() {
  const csPhone = process.env.NEXT_PUBLIC_CS_WHATSAPP ?? "6281234567890";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hubungi Kami</h1>
        <p className="text-gray-500 mt-1">Kami siap membantu Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp</h2>
            <p className="text-sm text-gray-600 mt-1">
              Chat langsung dengan customer service kami via WhatsApp
            </p>
          </div>
          <a
            href={buildWhatsAppUrl(csPhone, "Halo, saya membutuhkan bantuan mengenai TCG Marketplace.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Chat via WhatsApp
          </a>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Jam Operasional</h2>
            <p className="text-sm text-gray-600 mt-1">Senin - Jumat: 09.00 - 17.00 WIB</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            Waktu respons: 1-2 hari kerja
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Form Keluhan</h2>
        <ComplaintForm csPhone={csPhone} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">Pertanyaan Umum</h2>
        <div className="flex flex-col gap-2">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-gray-900 hover:bg-gray-50">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
