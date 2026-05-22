"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";

export function useChatUnread(userId: string) {
  const [hasUnread, setHasUnread] = useState(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (pathname === "/chat") {
      setHasUnread(false);
    }
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/stream-token", { method: "POST" });
        if (!res.ok || cancelled) return;
        const {
          token,
          apiKey,
          userId: uid,
          userName,
          userImage,
        } = await res.json();
        if (cancelled) return;

        const client = StreamChat.getInstance(apiKey);

        if (client.userID && client.userID !== uid) {
          await client.disconnectUser().catch(() => {});
        }
        if (cancelled) return;

        if (!client.userID) {
          await client.connectUser(
            { id: uid, name: userName, image: userImage ?? undefined },
            token,
          );
        }
        if (cancelled) return;

        const totalUnread =
          (client.user as { total_unread_count?: number })
            ?.total_unread_count ?? 0;
        if (totalUnread > 0 && pathnameRef.current !== "/chat") {
          setHasUnread(true);
        }

        client.on("notification.message_new", () => {
          if (pathnameRef.current !== "/chat") {
            setHasUnread(true);
          }
        });

        client.on("notification.mark_read", (event) => {
          const remaining =
            (event as { total_unread_count?: number }).total_unread_count ?? 0;
          if (remaining === 0) setHasUnread(false);
        });
      } catch {
        // Stream unavailable — silent fail
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { hasUnread, isOnChatPage: pathname === "/chat" };
}
