"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { getInitials } from "@/lib/utils";
import { UserProfileModal } from "./UserProfileModal";

export function CustomChannelHeader() {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const currentUserId = client.userID;
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const members = Object.values(channel.state.members);
  const memberCount =
    (channel.data?.member_count as number | undefined) ?? members.length;
  const isGroup = memberCount > 2;

  let title: string;

  if (isGroup) {
    title =
      (channel.data?.name as string | undefined) ??
      members
        .filter((m) => m.user?.id !== currentUserId)
        .map((m) => (m.user?.name ?? "").split(" ")[0])
        .filter(Boolean)
        .join(", ");
  } else {
    const other = members.find((m) => m.user?.id !== currentUserId);
    title =
      other?.user?.name ?? (channel.data?.name as string | undefined) ?? "Chat";
  }

  const displayMembers = isGroup
    ? members.filter((m) => m.user?.id !== currentUserId).slice(0, 5)
    : members.filter((m) => m.user?.id !== currentUserId).slice(0, 1);

  return (
    <>
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        {/* Stacked member avatars */}
        <div className="flex items-center -space-x-2 shrink-0">
          {displayMembers.map((m) => {
            const uid = m.user?.id;
            const name = m.user?.name ?? "";
            const image = m.user?.image as string | undefined;
            return (
              <button
                type="button"
                key={uid ?? name}
                onClick={() => uid && setProfileUserId(uid)}
                title={name}
                className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-700 text-xs font-semibold overflow-hidden shrink-0 hover:z-10 hover:scale-110 transition-transform relative"
              >
                {image ? (
                  // biome-ignore lint/performance/noImgElement: external Stream CDN user avatar
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(name)
                )}
              </button>
            );
          })}
          {isGroup && memberCount > displayMembers.length + 1 && (
            <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-semibold shrink-0">
              +{memberCount - displayMembers.length - 1}
            </div>
          )}
        </div>

        {/* Title + sub-info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </p>
          {isGroup && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Users className="h-3 w-3" />
              <span>{memberCount} anggota</span>
            </div>
          )}
        </div>
      </div>

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </>
  );
}
