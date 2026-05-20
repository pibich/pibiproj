"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/types/supabase";

type NotificationWithAuction = Notification & {
  auction: { id: string; title: string } | null;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithAuction[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      })
      .catch(() => {});
  }, []);

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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  function handleNotificationClick(auctionId: string | null | undefined) {
    setOpen(false);
    if (auctionId) {
      router.push(`/auctions/${auctionId}`);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-sky-100 shadow-xl shadow-sky-100/50 z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50">
            <p className="text-sm font-semibold text-slate-800">Notifikasi</p>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Belum ada notifikasi
              </p>
            )}

            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n.auction?.id)}
                className="w-full text-left"
              >
                <NotificationItem
                  type={n.type}
                  auctionTitle={n.auction?.title}
                  createdAt={n.created_at}
                  isRead={n.is_read}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
