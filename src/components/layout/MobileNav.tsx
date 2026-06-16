"use client";

import { Gavel, MessageSquare, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatUnread } from "@/hooks/useChatUnread";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userId: string;
  username: string;
}

export function MobileNav({ userId, username }: MobileNavProps) {
  const pathname = usePathname();
  const { hasUnread, isOnChatPage } = useChatUnread(userId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-1px_12px_rgba(37,99,235,0.08)]">
      <div className="flex items-center justify-evenly h-14">
        {/* Lelang / Beranda — home now hosts the unified auction listing */}
        <Link
          href="/"
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
            pathname === "/" ||
              (pathname.startsWith("/auctions") &&
                pathname !== "/auctions/create")
              ? "text-teal-600"
              : "text-slate-400 hover:text-teal-500",
          )}
        >
          <Gavel className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Lelang</span>
        </Link>

        {/* Buat */}
        <Link
          href="/auctions/create"
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
            pathname === "/auctions/create"
              ? "text-teal-600"
              : "text-slate-400 hover:text-teal-500",
          )}
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Buat</span>
        </Link>

        {/* Chat with unread badge */}
        <Link
          href="/chat"
          className={cn(
            "relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
            isOnChatPage
              ? "text-teal-600"
              : "text-slate-400 hover:text-teal-500",
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
            "flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
            pathname.startsWith("/profile")
              ? "text-teal-600"
              : "text-slate-400 hover:text-teal-500",
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
