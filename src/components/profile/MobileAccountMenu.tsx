"use client";

import {
  ChevronRight,
  ClipboardCheck,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export function MobileAccountMenu({
  isMiddleman = false,
  isAdmin = false,
}: {
  isMiddleman?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  const links = [
    ...(isMiddleman
      ? [
          {
            href: "/middleman/dashboard",
            label: "Dashboard Middleman",
            icon: ClipboardCheck,
          },
        ]
      : []),
    ...(isAdmin
      ? [{ href: "/admin", label: "Dashboard Admin", icon: UserCog }]
      : []),
    { href: "/middleman", label: "Middleman", icon: ShieldCheck },
    { href: "/contact", label: "Hubungi Kami", icon: MessageSquare },
  ];

  return (
    <div className="md:hidden bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-teal-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
          Akun
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Icon className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span className="flex-1 text-left">Keluar</span>
        </button>
      </div>
    </div>
  );
}
