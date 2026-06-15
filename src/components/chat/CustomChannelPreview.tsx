"use client";

import { CheckCheck, Trash2, Users } from "lucide-react";
import { useState } from "react";
import type { Channel } from "stream-chat";
import { useChannelListContext, useChatContext } from "stream-chat-react";
import { cn, getInitials } from "@/lib/utils";

interface Props {
  channel: Channel;
  onSelect?: () => void;
  onHide?: () => void;
}

// Compact "time ago" label, e.g. "2 mnt", "1 jam", "3 hr".
function formatShortAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "baru";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} mnt`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hr`;
  return `${Math.floor(day / 7)} mgg`;
}

export function CustomChannelPreview({ channel, onSelect, onHide }: Props) {
  const { client, channel: activeChannel, setActiveChannel } = useChatContext();
  const { setChannels } = useChannelListContext();
  const currentUserId = client.userID;
  const [hovering, setHovering] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);

  const members = Object.values(channel.state.members);
  const memberCount =
    (channel.data?.member_count as number | undefined) ?? members.length;
  const isGroup = memberCount > 2;
  const otherUser = members.find((m) => m.user?.id !== currentUserId)?.user;
  const isOnline = !isGroup && !!otherUser?.online;

  let displayTitle: string;
  let displayImage: string | null = null;

  if (isGroup) {
    displayTitle =
      (channel.data?.name as string | undefined) ??
      members
        .filter((m) => m.user?.id !== currentUserId)
        .map((m) => (m.user?.name ?? "").split(" ")[0])
        .filter(Boolean)
        .join(", ");
  } else {
    const other = members.find((m) => m.user?.id !== currentUserId);
    displayTitle =
      other?.user?.name ?? (channel.data?.name as string | undefined) ?? "Chat";
    displayImage = (other?.user?.image as string | undefined) ?? null;
  }

  const lastMsg = channel.state.messages.at(-1);
  const lastText = lastMsg?.text?.trim().slice(0, 80) ?? "";
  const unreadCount = channel.countUnread();
  const isActive = activeChannel?.id === channel.id;

  const lastAt = channel.state.last_message_at ?? lastMsg?.created_at;
  const lastTime = lastAt ? formatShortAgo(new Date(lastAt)) : "";

  function handleSelect() {
    setActiveChannel?.(channel);
    onSelect?.();
    setHovering(false);
  }

  async function handleMarkRead(e: React.MouseEvent) {
    e.stopPropagation();
    await channel.markRead();
  }

  async function handleHide(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmHide(false);
    setHovering(false);
    await channel.hide(null, true);
    setChannels((prev) => prev.filter((ch) => ch.id !== channel.id));
    if (activeChannel?.id === channel.id) {
      setActiveChannel?.(undefined);
      onHide?.();
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover container for channel row actions
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setConfirmHide(false);
      }}
    >
      {/* Confirm hide overlay */}
      {confirmHide && (
        <div className="absolute inset-0 z-20 bg-white flex items-center justify-between gap-2 px-3 border-b border-gray-100">
          <p className="text-xs text-gray-600 truncate">
            Hapus percakapan ini?
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleHide}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmHide(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main channel row */}
      {/* biome-ignore lint/a11y/useSemanticElements: div role=button needed to nest avatar + text content without button reset */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSelect();
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer select-none",
          isActive ? "bg-teal-50" : "hover:bg-gray-50",
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-semibold">
            {displayImage ? (
              // biome-ignore lint/performance/noImgElement: external Stream CDN user avatar
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
            ) : displayTitle ? (
              getInitials(displayTitle)
            ) : (
              <Users className="h-4 w-4" />
            )}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white" />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayTitle}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {lastTime && !hovering && (
                <span className="text-[11px] text-gray-400">{lastTime}</span>
              )}
              {/* Unread badge — hidden when hovering to show action buttons */}
              {!!unreadCount && !hovering && (
                <span className="min-w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-semibold px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </div>
          {lastText && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{lastText}</p>
          )}
        </div>
      </div>

      {/* Action buttons — shown on hover, positioned over the right side */}
      {hovering && !confirmHide && (
        // biome-ignore lint/a11y/noStaticElementInteractions: trap hover so buttons stay visible when cursor moves to them
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 bg-white border border-gray-100 rounded-lg shadow-sm px-1 py-0.5"
          onMouseEnter={() => setHovering(true)}
        >
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkRead}
              title="Tandai sudah dibaca"
              className="p-1.5 rounded-md text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmHide(true);
            }}
            title="Hapus percakapan"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
