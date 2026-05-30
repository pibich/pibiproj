import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Masuk ke Akun" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-8">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-sky-200 group-hover:shadow-sky-300 transition-shadow">
              {/* biome-ignore lint/performance/noImgElement: small local SVG logo asset */}
              <img src="/logo.svg" alt="TCG Auction" className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              TCG <span className="text-sky-500">Auction</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Masuk ke Akun</h1>
          <p className="text-sm text-slate-500">
            Selamat datang kembali di TCG Auction
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
