import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-5 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-10 py-9">
          {/* Brand */}
          <div className="max-w-[340px]">
            <span className="font-display text-[17px] font-bold text-slate-900">
              TCG <span className="text-teal-600">Auction</span>
            </span>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
              TCG Auction adalah platform lelang kartu TCG terpercaya di
              Indonesia.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-16 gap-y-8">
            <div>
              <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Tautan
              </h4>
              <ul className="flex flex-col gap-2.5 text-[13.5px]">
                <li>
                  <Link
                    href="/#lelang"
                    className="text-slate-700 transition-colors hover:text-teal-600"
                  >
                    Lelang
                  </Link>
                </li>
                <li>
                  <Link
                    href="/middleman"
                    className="text-slate-700 transition-colors hover:text-teal-600"
                  >
                    Middleman
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-slate-700 transition-colors hover:text-teal-600"
                  >
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Kontak
              </h4>
              <ul className="flex flex-col gap-2.5 text-[13.5px]">
                <li>
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_CS_WHATSAPP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 transition-colors hover:text-teal-600"
                  >
                    WhatsApp CS
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 py-[18px] text-center text-xs text-slate-400">
          © {year} TCG Auction. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
