"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { StreamChat } from "stream-chat";
import { createClient } from "@/lib/supabase/client";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/types/supabase";

type NotificationWithAuction = Notification & {
  auction: { id: string; title: string } | null;
};

interface StreamMessage {
  type?: string;
  unread_count?: number;
  total_unread_count?: number;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithAuction[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [streamUnread, setStreamUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const totalUnread = unreadCount + streamUnread;

  // Fetch initial notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      })
      .catch(() => {});
  }, []);

  // Supabase Realtime: watch for new notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationWithAuction;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // GetStream: watch for new chat messages
  useEffect(() => {
    let streamClient: StreamChat | null = null;
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/stream-token", { method: "POST" });
        if (!res.ok || cancelled) return;
        const { token, apiKey, userId: uid, userName, userImage } = await res.json();
        if (cancelled) return;

        streamClient = StreamChat.getInstance(apiKey);

        if (streamClient.userID && streamClient.userID !== uid) {
          await streamClient.disconnectUser().catch(() => {});
        }
        if (cancelled) return;

        if (!streamClient.userID) {
          await streamClient.connectUser(
            { id: uid, name: userName, image: userImage ?? undefined },
            token
          );
        }
        if (cancelled) return;

        // Set initial unread count
        setStreamUnread(streamClient.user?.total_unread_count ?? 0);

        streamClient.on("notification.message_new", (event: StreamMessage) => {
          setStreamUnread((c) => c + (event.unread_count ?? 1));
        });

        streamClient.on("notification.mark_read", (event: StreamMessage) => {
          setStreamUnread(event.total_unread_count ?? 0);
        });
      } catch {
        // GetStream unavailable — silent fail, chat badge just won't show
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      // Mark Supabase notifications as read
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  function handleChatNotificationClick() {
    setStreamUnread(0);
    setOpen(false);
    router.push("/chat");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-sky-100 shadow-xl shadow-sky-100/50 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50">
            <p className="text-sm font-semibold text-slate-800">Notifikasi</p>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {streamUnread > 0 && (
              <button
                onClick={handleChatNotificationClick}
                className="w-full text-left"
              >
                <NotificationItem
                  type="new_message"
                  isRead={false}
                />
              </button>
            )}

            {notifications.length === 0 && streamUnread === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Belum ada notifikasi
              </p>
            )}

            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                type={n.type}
                auctionTitle={n.auction?.title}
                createdAt={n.created_at}
                isRead={n.is_read}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
