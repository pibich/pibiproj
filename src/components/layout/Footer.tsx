import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-teal-900/30">
                {/* biome-ignore lint/performance/noImgElement: small local SVG logo asset */}
                <img src="/logo.svg" alt="TCG Auction" className="w-8 h-8" />
              </div>
              <span className="font-bold text-white">
                TCG <span className="text-teal-400">Auction</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              TCG Auction adalah platform lelang kartu TCG terpercaya di
              Indonesia.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              Tautan
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link
                  href="/auctions"
                  className="hover:text-slate-300 transition-colors"
                >
                  Lelang
                </Link>
              </li>
              <li>
                <Link
                  href="/middleman"
                  className="hover:text-slate-300 transition-colors"
                >
                  Middleman
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-slate-300 transition-colors"
                >
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              Kontak
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_CS_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-300 transition-colors"
                >
                  WhatsApp CS
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 mt-8 pt-6 text-xs text-center text-slate-500">
          © {year} TCG Auction. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
