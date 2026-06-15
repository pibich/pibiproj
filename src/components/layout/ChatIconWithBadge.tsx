"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useChatUnread } from "@/hooks/useChatUnread";

export function ChatIconWithBadge({ userId }: { userId: string }) {
  const { hasUnread, isOnChatPage } = useChatUnread(userId);

  return (
    <Link
      href="/chat"
      className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-teal-600"
      aria-label="Pesan"
    >
      <MessageSquare className="h-[18px] w-[18px]" />
      {hasUnread && !isOnChatPage && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
      )}
    </Link>
  );
}
