"use client";

import { Trash2 } from "lucide-react";
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

export function CustomMessage() {
  const { message, isMyMessage, handleReaction, handleDelete } =
    useMessageContext();

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwn = isMyMessage();
  const isDeleted = message.type === "deleted" || !!message.deleted_at;
  const isSystem = message.type === "system";

  const hasAttachments = (message.attachments?.length ?? 0) > 0;
  const hasText = !!message.text?.trim();
  const hasReactions =
    !!message.reaction_groups &&
    Object.keys(message.reaction_groups).length > 0;

  // ─── System events (member joined, etc.) → centered pill ──────────────────
  if (isSystem) {
    return (
      <div className="flex justify-center px-3 py-2">
        <span className="rounded-full bg-teal-50 text-teal-700 text-xs px-3 py-1.5 text-center max-w-[80%]">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "group flex items-end gap-2 px-3 py-1",
        isOwn ? "flex-row-reverse" : "flex-row",
      ].join(" ")}
    >
      {/* Message column */}
      <div
        className={[
          "flex flex-col gap-0.5 max-w-[75%]",
          isOwn ? "items-end" : "items-start",
        ].join(" ")}
      >
        {/* Quoted/reply preview */}
        {message.quoted_message && <QuotedMessage />}

        {/* Deleted placeholder */}
        {isDeleted && (
          <div className="rounded-2xl px-3.5 py-2.5 text-sm bg-gray-100 text-gray-400 italic">
            Pesan ini telah dihapus
          </div>
        )}

        {/* Bubble */}
        {!isDeleted && (hasText || hasAttachments) && (
          <div
            className={[
              "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
              isOwn
                ? "bg-[#1f2433] text-white rounded-br-md"
                : "bg-white text-gray-900 border border-gray-200 rounded-bl-md",
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
            {/* Timestamp + delivery status inside bubble */}
            <div
              className={[
                "flex items-center gap-1 mt-1 text-[10px]",
                isOwn ? "text-white/50 justify-end" : "text-gray-400",
              ].join(" ")}
            >
              <MessageTimestamp />
              {isOwn && <MessageStatus />}
            </div>
          </div>
        )}

        {/* Inline delete confirmation */}
        {confirmDelete && (
          <div className="flex items-center gap-2 text-xs mt-0.5">
            <span className="text-gray-500">Hapus pesan ini?</span>
            <button
              type="button"
              onClick={async () => {
                setConfirmDelete(false);
                await handleDelete();
              }}
              className="text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Batal
            </button>
          </div>
        )}

        {/* Reactions bubble */}
        {hasReactions && <MessageReactions />}

        {/* Thread reply count */}
        <MessageRepliesCountButton />
      </div>

      {/* Action buttons — visible on hover */}
      {!isDeleted && (
        <div
          className={[
            "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center",
            isOwn ? "flex-row-reverse" : "flex-row",
          ].join(" ")}
        >
          {/* Emoji reaction trigger */}
          <div className="relative">
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

          {/* Delete button — own messages only */}
          {isOwn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete((v) => !v);
                setShowReactionPicker(false);
              }}
              className="p-1.5 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Hapus pesan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
