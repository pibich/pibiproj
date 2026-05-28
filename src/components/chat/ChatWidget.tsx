"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import type { ChannelAvatarProps, GalleryProps } from "stream-chat-react";
import {
  AttachmentSelector,
  Channel,
  ChannelList,
  Chat,
  ComponentProvider,
  defaultAttachmentSelectorActionSet,
  MessageComposer,
  MessageList,
  Thread,
  useChannelStateContext,
  useChatContext,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Users,
  X,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/supabase";
import { CustomChannelHeader } from "./CustomChannelHeader";
import { CustomChannelPreview } from "./CustomChannelPreview";
import { CustomMessage } from "./CustomMessage";
import { NewMessageModal } from "./NewMessageModal";
import { UserProfileModal } from "./UserProfileModal";

interface ChatWidgetProps {
  currentUser: Pick<Profile, "id" | "name" | "username" | "avatar_url">;
  targetUserId?: string;
  auctionId?: string;
  className?: string;
}

function buildChannelId(ids: string[]): string {
  return ids
    .map((id) => id.replace(/-/g, ""))
    .sort()
    .join("")
    .slice(0, 64);
}

// ─── Infinite scroll paginator ───────────────────────────────────────────────
function InfiniteScrollPaginator({
  children,
  loadNextPage,
  hasNextPage,
}: React.PropsWithChildren<{
  loadNextPage: () => void;
  hasNextPage?: boolean;
  [k: string]: unknown;
}>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPage();
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, loadNextPage]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-px" />
    </>
  );
}

// ─── File-only AttachmentSelector (no Commands / Poll / Location) ─────────────
const fileOnlyActions = defaultAttachmentSelectorActionSet.filter(
  (a) => a.type === "uploadFile",
);

function FileOnlyAttachmentSelector() {
  return <AttachmentSelector attachmentSelectorActionSet={fileOnlyActions} />;
}

// ─── Custom image gallery lightbox ───────────────────────────────────────────
// Rendered via createPortal at document.body so it escapes Stream's modal
// stacking context (Stream's modal has z-index:100 + backdrop-filter which
// would otherwise contain our fixed overlay).
function ChatGallery({
  items,
  onRequestClose,
  initialIndex = 0,
}: GalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const [isMounted, setIsMounted] = useState(false);
  const current = items[index];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose?.();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose, items.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!current || !isMounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onRequestClose?.();
  };

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop handles click-to-close; keyboard (Escape/arrows) handled by window listener
    // biome-ignore lint/a11y/useKeyWithClickEvents: same — Escape is handled globally above, not per-element
    <div
      className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center cursor-default"
      onClick={handleBackdropClick}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Tutup"
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
        onClick={onRequestClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
          {index + 1} / {items.length}
        </div>
      )}

      {/* Prev */}
      {index > 0 && (
        <button
          type="button"
          aria-label="Sebelumnya"
          className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper — not interactive, just prevents backdrop close when clicking media */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same — keyboard is handled by the global window listener */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.videoUrl ? (
          // biome-ignore lint/a11y/useMediaCaption: user-uploaded chat videos lack caption tracks
          <video
            src={current.videoUrl}
            controls
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
        ) : (
          // biome-ignore lint/performance/noImgElement: external URLs from Stream CDN can't use next/image
          <img
            src={current.imageUrl}
            alt={current.alt ?? ""}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Next */}
      {index < items.length - 1 && (
        <button
          type="button"
          aria-label="Berikutnya"
          className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-2">
          {items.map((item, i) => (
            <button
              type="button"
              key={item.imageUrl ?? item.videoThumbnailUrl ?? String(i)}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={[
                "h-12 w-12 rounded-md overflow-hidden shrink-0 border-2 transition-all",
                i === index
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80",
              ].join(" ")}
            >
              {/* biome-ignore lint/performance/noImgElement: external Stream CDN URL */}
              <img
                src={item.imageUrl ?? item.videoThumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

// ─── Clickable avatar — opens profile modal when clicked in messages ───────────
// Always rendered inside a Channel (via ComponentProvider), so useChannelStateContext is safe.
function ClickableAvatar({
  imageUrl,
  userName,
  size,
  ...rest
}: ChannelAvatarProps) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const { members } = useChannelStateContext();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!userName) return;
    const member = Object.values(members ?? {}).find(
      (m) =>
        (m as { user?: { id?: string; name?: string } }).user?.name ===
        userName,
    );
    const uid = (member as { user?: { id?: string } } | undefined)?.user?.id;
    if (uid) setProfileUserId(uid);
  }

  const sizeClass =
    size === "2xl"
      ? "w-16 h-16 text-xl"
      : size === "xl"
        ? "w-12 h-12 text-lg"
        : size === "lg"
          ? "w-10 h-10 text-base"
          : size === "md"
            ? "w-8 h-8 text-sm"
            : size === "sm"
              ? "w-7 h-7 text-xs"
              : "w-6 h-6 text-xs";

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: avatar acts as a profile trigger, role=img with click */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: profile trigger via mouse; keyboard users can navigate to member list */}
      <div
        {...rest}
        onClick={handleClick}
        title={userName}
        className={[
          sizeClass,
          "rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0",
          userName ? "cursor-pointer hover:opacity-80 transition-opacity" : "",
          rest.className ?? "",
        ].join(" ")}
      >
        {imageUrl ? (
          // biome-ignore lint/performance/noImgElement: external Stream user avatar URLs
          <img
            src={imageUrl}
            alt={userName ?? ""}
            className="w-full h-full object-cover"
          />
        ) : userName ? (
          getInitials(userName)
        ) : (
          <Users className="h-4 w-4" />
        )}
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

// ─── Shared component overrides injected via ComponentProvider ────────────────
const chatComponents = {
  AttachmentSelector: FileOnlyAttachmentSelector,
  Gallery: ChatGallery as ComponentType<GalleryProps>,
  Avatar: ClickableAvatar as ComponentType<ChannelAvatarProps>,
};

// ─── Inbox layout ────────────────────────────────────────────────────────────
function ChannelListLayout({
  userId,
  initialTargetUserId,
}: {
  userId: string;
  initialTargetUserId?: string;
}) {
  const { client, setActiveChannel } = useChatContext();
  const [activeChannel, setLocalActiveChannel] = useState<StreamChannel | null>(
    null,
  );
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const channelInitialized = useRef(false);

  useEffect(() => {
    if (!initialTargetUserId || !client || channelInitialized.current) return;
    channelInitialized.current = true;

    const members = [userId, initialTargetUserId];
    const channelId = buildChannelId(members);

    const watchWithRetry = (ch: ReturnType<typeof client.channel>, attempt = 0): Promise<typeof ch> =>
      ch.watch().then(() => ch).catch((err) => {
        if (attempt >= 2) throw err;
        return new Promise<typeof ch>((resolve, reject) =>
          setTimeout(
            () => watchWithRetry(ch, attempt + 1).then(resolve).catch(reject),
            1000 * (attempt + 1),
          ),
        );
      });

    fetch("/api/stream/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, memberIds: members }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`stream/group failed: ${res.status}`);
        // Use channel().watch() instead of queryChannels — avoids the membership
        // propagation delay that can cause queryChannels to return 0 results
        // immediately after addMembers() completes on the server.
        const ch = client.channel("messaging", channelId);
        return watchWithRetry(ch);
      })
      .then((ch) => {
        setLocalActiveChannel(ch);
        setActiveChannel?.(ch);
        setMobileShowChat(true);
      })
      .catch(console.error);
  }, [initialTargetUserId, client, userId, setActiveChannel]);

  function handleSelectChannel(channel: StreamChannel) {
    setLocalActiveChannel(channel);
    setMobileShowChat(true);
  }

  function handleBack() {
    // Only update mobile nav state — keep activeChannel loaded so ChannelList
    // stays populated and doesn't flash blank on return
    setMobileShowChat(false);
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel: conversation list ───────────────────────────────── */}
      <div
        className={[
          "flex-col h-full border-r border-gray-100 bg-white shrink-0 relative z-10",
          "w-full sm:w-72",
          // Mobile: hide list when viewing a chat; desktop: always show
          mobileShowChat ? "hidden sm:flex" : "flex",
        ].join(" ")}
      >
        <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">
            Percakapan
          </span>
          <button
            type="button"
            onClick={() => setNewMessageOpen(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-2 py-1 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Pesan
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <ChannelList
            filters={{ members: { $in: [userId] } }}
            sort={{ last_message_at: -1 }}
            EmptyStateIndicator={() => (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-sm">Belum ada percakapan</p>
              </div>
            )}
            renderChannels={(channels) => (
              <div>
                {(channels as StreamChannel[]).map((ch) => (
                  <CustomChannelPreview
                    key={ch.id}
                    channel={ch}
                    onSelect={() => handleSelectChannel(ch)}
                    onHide={handleBack}
                  />
                ))}
              </div>
            )}
            Paginator={InfiniteScrollPaginator}
          />
        </div>
      </div>

      {/* ── Right panel: active channel ──────────────────────────────────── */}
      <div
        className={[
          "flex-1 min-w-0 flex-col",
          // Mobile: show chat panel only when mobileShowChat; desktop: show when activeChannel
          mobileShowChat ? "flex" : "hidden sm:flex",
        ].join(" ")}
      >
        {activeChannel ? (
          <Channel channel={activeChannel}>
            <ComponentProvider value={chatComponents}>
              <Window>
                <div className="sm:hidden shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </button>
                </div>
                <CustomChannelHeader />
                <MessageList Message={CustomMessage as ComponentType} />
                <MessageComposer />
              </Window>
              <Thread />
            </ComponentProvider>
          </Channel>
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p className="text-sm">Pilih percakapan untuk memulai chat</p>
          </div>
        )}
      </div>

      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        currentUserId={userId}
        onCreated={(ch) => {
          setLocalActiveChannel(ch);
          setActiveChannel?.(ch);
          setNewMessageOpen(false);
          setMobileShowChat(true);
        }}
      />
    </div>
  );
}

// Module-level promise to serialise concurrent connectUser calls.
// React StrictMode double-invokes effects; without this guard the second
// invocation races the first on the shared StreamChat singleton.
let _connectPromise: Promise<StreamChat> | null = null;

async function getOrConnectClient(
  apiKey: string,
  userId: string,
  userName: string,
  userImage: string | undefined,
  token: string,
): Promise<StreamChat> {
  // If a connection is already in flight, reuse it.
  if (_connectPromise) return _connectPromise;

  const chatClient = StreamChat.getInstance(apiKey);

  // Already set up as the same user — check if the WS is still healthy.
  if (chatClient.userID === userId) {
    const ws = (chatClient as unknown as { wsConnection?: { isHealthy?: boolean } }).wsConnection;
    // If the connection is explicitly unhealthy (dropped), disconnect and re-auth below.
    if (ws && ws.isHealthy === false) {
      await chatClient.disconnectUser().catch(() => {});
    } else {
      return chatClient;
    }
  }

  // Different user was connected — disconnect first.
  if (chatClient.userID) {
    await chatClient.disconnectUser().catch(() => {});
  }

  _connectPromise = chatClient
    .connectUser({ id: userId, name: userName, image: userImage }, token)
    .then(() => chatClient)
    .finally(() => {
      _connectPromise = null;
    });

  return _connectPromise;
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export function ChatWidget({
  currentUser,
  targetUserId,
  className,
}: ChatWidgetProps) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/stream-token", { method: "POST" });
        if (cancelled) return;
        if (!res.ok) throw new Error("Failed to get token");

        const { token, apiKey, userId, userName, userImage } = await res.json();
        if (cancelled) return;

        const chatClient = await getOrConnectClient(
          apiKey,
          userId,
          userName,
          userImage ?? undefined,
          token,
        );
        if (cancelled) return;

        setClient(chatClient);
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
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memuat chat...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200 text-red-500 text-sm">
        {error ?? "Gagal memuat chat"}
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-white ${className ?? "rounded-xl border border-gray-200"}`}
    >
      <div className="flex-1 min-h-0 flex flex-col rounded-xl">
        <Chat client={client} theme="str-chat__theme-light">
          <ChannelListLayout
            userId={currentUser.id}
            initialTargetUserId={targetUserId}
          />
        </Chat>
      </div>
    </div>
  );
}
