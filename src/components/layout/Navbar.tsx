"use client";

import {
  ClipboardCheck,
  Gavel,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/supabase";
import { ChatIconWithBadge } from "./ChatIconWithBadge";

interface NavbarProps {
  user: Profile | null;
  onLogout: () => void;
  hideOnMobile?: boolean;
}

const navLinks = [
  { href: "/#lelang", label: "Lelang", icon: Gavel },
  { href: "/middleman", label: "Middleman", icon: Users },
  { href: "/contact", label: "Hubungi Kami", icon: MessageSquare },
];

export function Navbar({ user, onLogout, hideOnMobile = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search bar (unless already typing in a field)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (el as HTMLElement)?.isContentEditable
      )
        return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}#lelang` : "/#lelang");
    setMobileOpen(false);
  }

  function isActive(href: string) {
    const base = href.split("#")[0] || "/";
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-[#f8f4ec]/85 backdrop-blur-md border-b border-slate-200 shadow-sm shadow-slate-200/40 ${
        hideOnMobile ? "hidden md:block" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-5 h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-slate-200 group-hover:shadow-slate-300 transition-shadow">
              {/* biome-ignore lint/performance/noImgElement: small local SVG logo asset */}
              <img src="/logo.svg" alt="TCG Auction" className="w-8 h-8" />
            </div>
            <span className="font-bold text-slate-900 hidden sm:block tracking-tight">
              TCG <span className="text-teal-600">Auction</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive(href)
                    ? "text-teal-600"
                    : "text-slate-600 hover:text-teal-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 items-center gap-2.5 h-10 max-w-[420px] rounded-full border border-slate-200 bg-white px-4 transition-all focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kartu, set, atau seller…"
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 lg:block">
              /
            </kbd>
          </form>

          <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            {user ? (
              <>
                <Link href="/auctions/create">
                  <Button
                    size="sm"
                    className="hidden h-10 rounded-full px-5 text-sm font-bold shadow-sm shadow-teal-200 sm:flex"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Lelang
                  </Button>
                </Link>

                <ChatIconWithBadge userId={user.id} />

                <NotificationBell userId={user.id} channelId="desktop" />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="Menu akun"
                    className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-900 to-indigo-700 text-xs font-bold text-white ring-1 ring-black/10 transition-transform hover:scale-105"
                  >
                    {user.avatar_url ? (
                      // biome-ignore lint/performance/noImgElement: Supabase CDN URLs not compatible with next/image domain allowlist
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </button>

                  {userMenuOpen && (
                    <>
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close overlay */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape handled globally; backdrop is mouse-only dismiss */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 w-52 bg-white/90 backdrop-blur-md rounded-xl border border-slate-100 shadow-xl shadow-slate-100/50 z-20 py-1">
                        <div className="px-4 py-2.5 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-teal-50 rounded-t-xl">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-teal-500 truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Profil
                        </Link>
                        {user.is_middleman && (
                          <Link
                            href="/middleman/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-teal-600 hover:bg-slate-50 transition-colors"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Dashboard Middleman
                          </Link>
                        )}
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-teal-600 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-slate-50 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onLogout();
                            }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Keluar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Daftar</Button>
                </Link>
              </div>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-[#f8f4ec]/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
          <form
            onSubmit={handleSearch}
            className="mb-2 flex items-center gap-2.5 h-11 rounded-full border border-slate-200 bg-white px-4 focus-within:border-slate-400"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kartu, set, atau seller…"
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </form>

          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors font-medium"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}

          {user && (
            <>
              <Link
                href="/auctions/create"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-teal-600 hover:bg-slate-50 font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Buat Lelang
              </Link>
              <Link
                href={`/profile/${user.username}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors font-medium"
              >
                <User className="h-4 w-4" />
                Profil
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
