"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  Attachment,
  MessageReactions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageTimestamp,
  QuotedMessage,
  ReactionSelector,
  useMessageContext,
} from "stream-chat-react";
import { getInitials } from "@/lib/utils";
import { UserProfileModal } from "./UserProfileModal";

export function CustomMessage() {
  const { message, isMyMessage, handleReaction } = useMessageContext();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const isOwn = isMyMessage();
  const isDeleted = message.type === "deleted" || !!message.deleted_at;
  const warningCount =
    (message.user as { buyer_warning_count?: number } | undefined)
      ?.buyer_warning_count ?? 0;
  const hasAttachments = (message.attachments?.length ?? 0) > 0;
  const hasText = !!message.text?.trim();
  const hasReactions =
    !!message.reaction_groups &&
    Object.keys(message.reaction_groups).length > 0;

  return (
    <>
      <div
        className={[
          "group flex items-end gap-2 px-3 py-0.5",
          isOwn ? "flex-row-reverse" : "flex-row",
        ].join(" ")}
      >
        {/* Avatar + warning badge */}
        <div className="relative shrink-0 mb-1">
          <button
            type="button"
            onClick={() =>
              message.user?.id && setProfileUserId(message.user.id)
            }
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold overflow-hidden hover:opacity-80 transition-opacity border-2 border-white shadow-sm"
          >
            {message.user?.image ? (
              // biome-ignore lint/performance/noImgElement: external Stream CDN avatar
              <img
                src={message.user.image as string}
                alt={message.user.name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(message.user?.name ?? "?")
            )}
          </button>
          {warningCount > 0 && (
            <div
              className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 shadow-sm"
              title={`${warningCount}x peringatan pembeli`}
            >
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Message column */}
        <div
          className={[
            "flex flex-col gap-0.5 max-w-[70%]",
            isOwn ? "items-end" : "items-start",
          ].join(" ")}
        >
          {/* Quoted/reply preview */}
          {message.quoted_message && <QuotedMessage />}

          {/* Deleted placeholder */}
          {isDeleted && (
            <div className="rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-400 italic border border-gray-200">
              Pesan ini telah dihapus
            </div>
          )}

          {/* Bubble */}
          {!isDeleted && (hasText || hasAttachments) && (
            <div
              className={[
                "rounded-2xl px-3 py-2 text-sm shadow-sm",
                isOwn
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-blue-100 text-gray-900 rounded-bl-none",
              ].join(" ")}
            >
              {hasAttachments && (
                <Attachment attachments={message.attachments ?? []} />
              )}
              {hasText && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.text}
                </p>
              )}
            </div>
          )}

          {/* Reactions bubble */}
          {hasReactions && <MessageReactions />}

          {/* Thread reply count */}
          <MessageRepliesCountButton />

          {/* Timestamp + delivery status */}
          <div
            className={[
              "flex items-center gap-1 text-[10px] text-gray-400 mt-0.5",
              isOwn ? "flex-row-reverse" : "flex-row",
            ].join(" ")}
          >
            <MessageTimestamp />
            {isOwn && <MessageStatus />}
          </div>
        </div>

        {/* Emoji reaction trigger — visible on hover */}
        {!isDeleted && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity self-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReactionPicker((v) => !v);
              }}
              className="p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors text-sm leading-none"
            >
              😊
            </button>
            {showReactionPicker && (
              <div
                className={[
                  "absolute bottom-8 z-50",
                  isOwn ? "right-0" : "left-0",
                ].join(" ")}
              >
                <ReactionSelector
                  handleReaction={async (type, e) => {
                    await handleReaction(type, e);
                    setShowReactionPicker(false);
                  }}
                />
              </div>
            )}
          </div>
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
