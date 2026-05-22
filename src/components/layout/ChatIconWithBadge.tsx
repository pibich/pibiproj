"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useChatUnread } from "@/hooks/useChatUnread";

export function ChatIconWithBadge({ userId }: { userId: string }) {
  const { hasUnread, isOnChatPage } = useChatUnread(userId);

  return (
    <Link
      href="/chat"
      className="relative p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
      aria-label="Pesan"
    >
      <MessageSquare className="h-5 w-5" />
      {hasUnread && !isOnChatPage && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
      )}
    </Link>
  );
}
