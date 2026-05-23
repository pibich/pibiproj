"use client";

import { useEffect, useState } from "react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import type { Profile } from "@/types/supabase";

interface ChatContentProps {
  currentUser: Pick<Profile, "id" | "name" | "username" | "avatar_url">;
  seller?: string;
  auction?: string;
}

function ChatLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Memuat chat...</p>
      </div>
    </div>
  );
}

export function ChatContent({
  currentUser,
  seller,
  auction,
}: ChatContentProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    function onChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (isMobile === null) {
    return (
      <div style={{ height: "calc(100dvh - 6.5rem)" }}>
        <ChatLoading />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        className="overflow-hidden py-2"
        style={{ height: "calc(100dvh - 6.5rem)" }}
      >
        <ChatWidget
          currentUser={currentUser}
          targetUserId={seller}
          auctionId={auction}
          className="rounded-none border-0"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Pesan</h1>
        <div style={{ height: "min(calc(100dvh - 10rem), 680px)" }}>
          <ChatWidget
            currentUser={currentUser}
            targetUserId={seller}
            auctionId={auction}
          />
        </div>
      </div>
    </div>
  );
}
