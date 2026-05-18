"use client";

import { useMessageContext } from "stream-chat-react";
import { AlertTriangle } from "lucide-react";

export function CustomMessage() {
  const { message, isMyMessage } = useMessageContext();

  const warningCount =
    (message.user as { buyer_warning_count?: number } | undefined)?.buyer_warning_count ?? 0;

  return (
    <div className={`str-chat__message-simple ${isMyMessage() ? "str-chat__message-simple--me" : ""}`}>
      {/* Warning indicator next to sender name */}
      {!isMyMessage() && warningCount > 0 && (
        <div
          className="flex items-center gap-1 text-xs text-orange-500 mb-0.5 ml-10"
          title={`Pengguna ini memiliki ${warningCount}x peringatan`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{warningCount}x peringatan</span>
        </div>
      )}
      {/* Render default message bubble via Stream's inner component */}
      <div className="str-chat__message-inner">
        <div className="str-chat__message-bubble">
          <div className="str-chat__message-text">
            {typeof message.text === "string" ? message.text : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
