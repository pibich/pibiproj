"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageComposer,
  Thread,
  Window,
  ChannelList,
  Message,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { Users } from "lucide-react";
import type { Profile } from "@/types/supabase";
import { MiddlemanModal } from "./MiddlemanModal";
import { CustomMessage } from "./CustomMessage";

interface ChatWidgetProps {
  currentUser: Pick<Profile, "id" | "name" | "username" | "avatar_url">;
  targetUserId?: string;
  auctionId?: string;
}

function buildChannelId(ids: string[]): string {
  return ids
    .map((id) => id.replace(/-/g, ""))
    .sort()
    .join("")
    .slice(0, 64);
}

export function ChatWidget({ currentUser, targetUserId, auctionId }: ChatWidgetProps) {
  const t = useTranslations("chat");
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<ReturnType<StreamChat["channel"]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [middlemanModalOpen, setMiddlemanModalOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    let chatClient: StreamChat | null = null;
    let cancelled = false;
    let connected = false;

    async function init() {
      try {
        const res = await fetch("/api/stream-token", { method: "POST" });
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to get token");

        const { token, apiKey, userId, userName, userImage } = await res.json();
        if (cancelled) return;

        chatClient = StreamChat.getInstance(apiKey);

        if (chatClient.userID && chatClient.userID !== userId) {
          await chatClient.disconnectUser().catch(() => {});
        }
        if (cancelled) return;

        if (!chatClient.userID) {
          await chatClient.connectUser(
            { id: userId, name: userName, image: userImage ?? undefined },
            token
          );
        }

        if (cancelled) {
          chatClient.disconnectUser().catch(() => {});
          return;
        }
        connected = true;

        setClient(chatClient);

        if (targetUserId && targetUserId !== userId) {
          const initialMembers = [userId, targetUserId];
          const channelId = buildChannelId(initialMembers);
          const ch = chatClient.channel("messaging", channelId, {
            members: initialMembers,
          });
          if (cancelled) return;
          await ch.watch();
          if (cancelled) return;
          setChannel(ch);
          setMemberIds(initialMembers);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Gagal memuat chat. Coba refresh halaman.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (connected) {
        chatClient?.disconnectUser().catch(() => {});
      }
    };
  }, [currentUser.id, targetUserId, auctionId]);

  async function handleInviteMiddleman(middlemanId: string, middlemanName: string) {
    if (!client || !targetUserId) return;
    setMiddlemanModalOpen(false);

    const allMembers = [currentUser.id, targetUserId, middlemanId];
    const groupChannelId = buildChannelId(allMembers);

    const groupCh = client.channel("messaging", groupChannelId, {
      members: allMembers,
      name: "Grup Middleman",
    });
    await groupCh.watch();
    setChannel(groupCh);
    setMemberIds(allMembers);
    setIsGroup(true);
    setInviteSuccess(middlemanName);
    setTimeout(() => setInviteSuccess(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memuat chat...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        {error ?? "Gagal memuat chat"}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] rounded-xl overflow-hidden border border-gray-200 relative">
      <Chat client={client} theme="str-chat__theme-light">
        {targetUserId && channel ? (
          <>
            {/* Invite middleman toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isGroup && (
                  <>
                    <Users className="h-4 w-4" />
                    <span>{memberIds.length} anggota</span>
                  </>
                )}
                {inviteSuccess && (
                  <span className="text-green-600 text-xs font-medium">
                    {inviteSuccess} telah ditambahkan
                  </span>
                )}
              </div>
              {!isGroup && (
                <button
                  onClick={() => setMiddlemanModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  {t("inviteMiddleman")}
                </button>
              )}
            </div>

            <Channel channel={channel} Message={CustomMessage as typeof Message}>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageComposer />
              </Window>
              <Thread />
            </Channel>

            <MiddlemanModal
              open={middlemanModalOpen}
              onClose={() => setMiddlemanModalOpen(false)}
              onSelect={handleInviteMiddleman}
              currentMemberIds={memberIds}
            />
          </>
        ) : (
          <div className="flex h-full">
            <ChannelList
              filters={{ members: { $in: [currentUser.id] } }}
              sort={{ last_message_at: -1 }}
            />
            <Channel Message={CustomMessage as typeof Message}>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageComposer />
              </Window>
              <Thread />
            </Channel>
          </div>
        )}
      </Chat>
    </div>
  );
}
