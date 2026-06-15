"use client";

import { ClipboardList, Info, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { getInitials } from "@/lib/utils";
import { MiddlemanGuideModal } from "./MiddlemanGuideModal";
import { MiddlemanSchemaModal } from "./MiddlemanSchemaModal";
import { UserProfileModal } from "./UserProfileModal";

export function CustomChannelHeader() {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const currentUserId = client.userID;
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasMiddleman, setHasMiddleman] = useState(false);
  const [middlemanMemberId, setMiddlemanMemberId] = useState<string | undefined>(undefined);

  async function handleSendSchema(text: string) {
    await channel.sendMessage({ text });
  }

  const members = Object.values(channel.state.members);
  const memberCount =
    (channel.data?.member_count as number | undefined) ?? members.length;
  const isGroup = memberCount > 2;

  useEffect(() => {
    const memberIds = new Set(
      Object.values(channel.state.members)
        .map((m) => m.user?.id)
        .filter(Boolean),
    );
    fetch("/api/middlemen")
      .then((r) => r.json())
      .then((data) => {
        const mmList: { id: string }[] = data.middlemen ?? [];
        const found = mmList.find((mm) => memberIds.has(mm.id));
        setHasMiddleman(!!found);
        setMiddlemanMemberId(found?.id);
      })
      .catch(() => { setHasMiddleman(false); setMiddlemanMemberId(undefined); });
  }, [channel.id, memberCount]);


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

  const otherMembers = members.filter((m) => m.user?.id !== currentUserId);
  const displayMembers = isGroup
    ? otherMembers.slice(0, 5)
    : otherMembers.slice(0, 1);

  // Presence + subtitle for the conversation header
  const isOnline = otherMembers.some((m) => m.user?.online);
  const subtitle = isGroup
    ? `${memberCount} anggota`
    : [
        isOnline ? "Online" : "Offline",
        hasMiddleman ? "Middleman terverifikasi" : null,
      ]
        .filter(Boolean)
        .join(" · ");

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
              <div key={uid ?? name} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => uid && setProfileUserId(uid)}
                  title={name}
                  className="w-9 h-9 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-teal-700 text-xs font-semibold overflow-hidden hover:z-10 hover:scale-110 transition-transform relative"
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
                {/* Online dot — DM only */}
                {!isGroup && m.user?.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-500 border-2 border-white" />
                )}
              </div>
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
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            {isGroup && <Users className="h-3 w-3 shrink-0" />}
            <span className="truncate font-mono">{subtitle}</span>
          </div>
        </div>

        {/* Form Middleman button — grup atau DM yang mengandung middleman */}
        {hasMiddleman && (
          <button
            type="button"
            onClick={() => setSchemaOpen(true)}
            className="relative shrink-0 flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 rounded-lg px-2.5 py-1.5 transition-colors"
            title="Form Middleman"
          >
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Form Middleman</span>
          </button>
        )}

        {/* Info — opens the other member's profile (DM) */}
        {!isGroup && otherMembers[0]?.user?.id && (
          <button
            type="button"
            onClick={() => {
              const uid = otherMembers[0]?.user?.id;
              if (uid) setProfileUserId(uid);
            }}
            title="Info kontak"
            className="shrink-0 p-2 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            <Info className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Middleman active banner */}
      {hasMiddleman && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-teal-50 border-b border-teal-100 text-teal-700 text-xs sm:text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            Middleman aktif di percakapan ini — dana ditahan sampai kartu
            diterima.
          </span>
        </div>
      )}

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
        currentUserId={currentUserId ?? undefined}
        middlemanId={middlemanMemberId}
        channelId={channel.id ?? undefined}
      />

      <MiddlemanGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
