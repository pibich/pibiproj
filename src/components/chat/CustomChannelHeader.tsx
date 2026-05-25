"use client";

import { ClipboardList, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { getInitials } from "@/lib/utils";
import { MiddlemanGuideModal } from "./MiddlemanGuideModal";
import { MiddlemanSchemaModal } from "./MiddlemanSchemaModal";
import { UserProfileModal } from "./UserProfileModal";

function guideKey(channelId: string) {
  return `mm_guide_${channelId}`;
}

export function CustomChannelHeader() {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const currentUserId = client.userID;
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasMiddleman, setHasMiddleman] = useState(false);
  const [guideSeen, setGuideSeen] = useState(true);

  async function handleSendSchema(text: string) {
    await channel.sendMessage({ text });
  }

  function handleGuideClose() {
    if (channel.id) localStorage.setItem(guideKey(channel.id), "1");
    setGuideSeen(true);
    setGuideOpen(false);
  }

  const members = Object.values(channel.state.members);
  const memberCount =
    (channel.data?.member_count as number | undefined) ?? members.length;
  const isGroup = memberCount > 2;

  useEffect(() => {
    if (!isGroup) {
      setHasMiddleman(false);
      return;
    }
    const memberIds = new Set(
      Object.values(channel.state.members)
        .map((m) => m.user?.id)
        .filter(Boolean),
    );
    fetch("/api/middlemen")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.middlemen ?? []).some((mm: { id: string }) =>
          memberIds.has(mm.id),
        );
        setHasMiddleman(found);
      })
      .catch(() => setHasMiddleman(false));
  }, [channel.id, isGroup, memberCount]);

  // Auto-open guide on first visit to this group with a middleman
  useEffect(() => {
    if (!isGroup || !hasMiddleman || !channel.id) return;
    const seen = !!localStorage.getItem(guideKey(channel.id));
    setGuideSeen(seen);
    if (!seen) setGuideOpen(true);
  }, [channel.id, isGroup, hasMiddleman]);

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

        {/* Form Middleman button — grup dengan middleman only */}
        {isGroup && hasMiddleman && (
          <button
            type="button"
            onClick={() => setSchemaOpen(true)}
            className="relative shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 transition-colors"
            title="Form Middleman"
          >
            {!guideSeen && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
            )}
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Form Middleman</span>
          </button>
        )}
      </div>

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}

      <MiddlemanSchemaModal
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        onSend={handleSendSchema}
        onOpenGuide={() => setGuideOpen(true)}
      />

      <MiddlemanGuideModal open={guideOpen} onClose={handleGuideClose} />
    </>
  );
}
