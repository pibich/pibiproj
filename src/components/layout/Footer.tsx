import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-sky-900/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">
                TCG <span className="text-sky-400">Marketplace</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              TCG Marketplace adalah platform lelang kartu TCG terpercaya di Indonesia.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-300 mb-3 uppercase tracking-wide">Tautan</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/auctions" className="hover:text-sky-300 transition-colors">
                  Lelang
                </Link>
              </li>
              <li>
                <Link href="/middleman" className="hover:text-sky-300 transition-colors">
                  Middleman
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sky-300 transition-colors">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-sky-300 mb-3 uppercase tracking-wide">Kontak</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_CS_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-300 transition-colors"
                >
                  WhatsApp CS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 mt-8 pt-6 text-xs text-center text-slate-500">
          © {year} TCG Marketplace. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
