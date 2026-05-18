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
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { MessageSquare } from "lucide-react";
import type { Profile } from "@/types/supabase";

interface ChatWidgetProps {
  currentUser: Pick<Profile, "id" | "name" | "username" | "avatar_url">;
  // If provided, open a direct channel with this user (from auction detail)
  targetUserId?: string;
  auctionId?: string;
}

export function ChatWidget({ currentUser, targetUserId, auctionId }: ChatWidgetProps) {
  const t = useTranslations("chat");
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<ReturnType<StreamChat["channel"]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // If singleton still has an active user from a previous mount, disconnect first
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

        // No await between here and connected = true, so cleanup cannot interleave
        if (cancelled) {
          chatClient.disconnectUser().catch(() => {});
          return;
        }
        connected = true;

        setClient(chatClient);

        if (targetUserId && targetUserId !== userId) {
          // UUIDs are 36 chars with dashes; two joined with "_" = 73 chars > Stream's 64-char limit.
          // Strip dashes: 32 + 32 = 64 chars exactly.
          const channelId = [userId, targetUserId]
            .sort()
            .map((id) => id.replace(/-/g, ""))
            .join("");
          const ch = chatClient.channel("messaging", channelId, {
            members: [userId, targetUserId],
          });
          if (cancelled) return;
          await ch.watch();
          if (cancelled) return;
          setChannel(ch);
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
      // Only disconnect if connectUser completed — avoids disconnecting a mid-connecting client
      // and prevents unhandled rejections from a fire-and-forget disconnect
      if (connected) {
        chatClient?.disconnectUser().catch(() => {});
      }
    };
  }, [currentUser.id, targetUserId, auctionId]);

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
    <div className="h-[calc(100vh-10rem)] rounded-xl overflow-hidden border border-gray-200">
      <Chat client={client} theme="str-chat__theme-light">
        {targetUserId && channel ? (
          <Channel channel={channel}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageComposer />
            </Window>
            <Thread />
          </Channel>
        ) : (
          <div className="flex h-full">
            <ChannelList
              filters={{ members: { $in: [currentUser.id] } }}
              sort={{ last_message_at: -1 }}
            />
            <Channel>
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
