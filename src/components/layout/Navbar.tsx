"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Gavel,
  MessageSquare,
  Users,
  LayoutDashboard,
  LogOut,
  User,
  ChevronDown,
  ShieldCheck,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { Profile } from "@/types/supabase";

interface NavbarProps {
  user: Profile | null;
  onLogout: () => void;
}

const navLinks = [
  { href: "/auctions", label: "Lelang", icon: Gavel },
  { href: "/middleman", label: "Middleman", icon: Users },
  { href: "/contact", label: "Hubungi Kami", icon: MessageSquare },
];

export function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-sky-100 shadow-sm shadow-sky-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-sky-200 group-hover:shadow-sky-300 transition-shadow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 hidden sm:block tracking-tight">
              TCG <span className="text-sky-500">Marketplace</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 font-medium"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/auctions/create">
                  <Button size="sm" className="hidden sm:flex shadow-sm shadow-sky-200">
                    <Plus className="h-4 w-4" />
                    Buat Lelang
                  </Button>
                </Link>

                <Link
                  href="/chat"
                  className="p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
                  aria-label="Pesan"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                <NotificationBell userId={user.id} />

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-sky-50 transition-all duration-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-sky-700 text-xs font-semibold ring-2 ring-sky-200">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 w-52 bg-white/90 backdrop-blur-md rounded-xl border border-sky-100 shadow-xl shadow-sky-100/50 z-20 py-1">
                        <div className="px-4 py-2.5 border-b border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-xl">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-sky-500 truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Profil
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-sky-600 hover:bg-sky-50 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-sky-50 mt-1 pt-1">
                          <button
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
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-600 transition-colors"
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
        <div className="md:hidden border-t border-sky-100 bg-white/90 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors font-medium"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {user && (
            <Link
              href="/auctions/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-sky-600 hover:bg-sky-50 font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Buat Lelang
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
