"use client";

import { Users } from "lucide-react";
import type { Channel } from "stream-chat";
import { useChatContext } from "stream-chat-react";
import { getInitials } from "@/lib/utils";

interface Props {
  channel: Channel;
}

export function CustomChannelPreview({ channel }: Props) {
  const { client, channel: activeChannel, setActiveChannel } = useChatContext();
  const currentUserId = client.userID;

  const members = Object.values(channel.state.members);
  const memberCount =
    (channel.data?.member_count as number | undefined) ?? members.length;
  const isGroup = memberCount > 2;

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

  return (
    <button
      type="button"
      onClick={() => setActiveChannel?.(channel)}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
        isActive ? "bg-blue-50" : "hover:bg-gray-50",
      ].join(" ")}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {displayTitle}
          </p>
          {!!unreadCount && (
            <span className="shrink-0 min-w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {lastText && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{lastText}</p>
        )}
      </div>
    </button>
  );
}
