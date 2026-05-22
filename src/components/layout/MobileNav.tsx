"use client";

import { Gavel, Home, MessageSquare, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatUnread } from "@/hooks/useChatUnread";
import { cn } from "@/lib/utils";

const navItems = [{ href: "/auctions", label: "Lelang", icon: Gavel }];

interface MobileNavProps {
  userId: string;
  username: string;
}

export function MobileNav({ userId, username }: MobileNavProps) {
  const pathname = usePathname();
  const { hasUnread, isOnChatPage } = useChatUnread(userId);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/90 backdrop-blur-md border-t border-sky-100 shadow-[0_-1px_12px_rgba(14,165,233,0.08)]">
      <div className="flex items-center justify-around px-2 h-14">
        {/* Beranda */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0",
            isActive("/")
              ? "text-sky-600"
              : "text-slate-400 hover:text-sky-500",
          )}
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Beranda</span>
        </Link>

        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0",
              isActive(href)
                ? "text-sky-600"
                : "text-slate-400 hover:text-sky-500",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-tight">
              {label}
            </span>
          </Link>
        ))}

        {/* Buat */}
        <Link
          href="/auctions/create"
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0",
            isActive("/auctions/create")
              ? "text-sky-600"
              : "text-slate-400 hover:text-sky-500",
          )}
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Buat</span>
        </Link>

        {/* Chat with unread badge */}
        <Link
          href="/chat"
          className={cn(
            "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0",
            isOnChatPage ? "text-sky-600" : "text-slate-400 hover:text-sky-500",
          )}
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5 shrink-0" />
            {hasUnread && !isOnChatPage && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
          </div>
          <span className="text-[10px] font-medium leading-tight">Chat</span>
        </Link>

        {/* Profil */}
        <Link
          href={`/profile/${username}`}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0",
            pathname.startsWith("/profile")
              ? "text-sky-600"
              : "text-slate-400 hover:text-sky-500",
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
