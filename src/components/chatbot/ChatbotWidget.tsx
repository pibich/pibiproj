"use client";

import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

function mkMsg(role: Message["role"], text: string): Message {
  return { id: crypto.randomUUID(), role, text };
}

const SESSION_KEY = "tcg_chatbot_session";
const INTRO_SEEN_KEY = "tcg_chatbot_intro_seen";

const INTRO_FEATURES = [
  "Cara bid & jual kartu",
  "Cara lapor pengguna bermasalah",
  "Hubungi customer service",
];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introSeen, setIntroSeen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem(INTRO_SEEN_KEY);
    if (!seen) {
      setIntroSeen(false);
      const timer = setTimeout(() => setShowIntro(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  function markIntroSeen() {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    setIntroSeen(true);
    setShowIntro(false);
  }

  function handleStartChat() {
    markIntroSeen();
    setOpen(true);
  }

  function handleToggle() {
    if (!introSeen) markIntroSeen();
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        mkMsg(
          "model",
          "Halo! Saya asisten TCG Marketplace. Saya dapat membantu Anda tentang cara bid, cara jual, cara lapor pengguna, atau menghubungi customer service. Ada yang bisa saya bantu?",
        ),
      ]);
    }
  }, [open, messages.length]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/loading are intentional change triggers, not closure references
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLimitError(null);

    const newMessages: Message[] = [...messages, mkMsg("user", userMessage)];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history,
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setLimitError(data.error);
        return;
      }

      if (!res.ok || !data.reply) {
        setMessages((prev) => [
          ...prev,
          mkMsg("model", "Maaf, terjadi kesalahan. Coba lagi nanti."),
        ]);
        return;
      }

      setMessages((prev) => [...prev, mkMsg("model", data.reply)]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showIntro && !open && (
        <div className="hidden md:block fixed bottom-24 right-6 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden animate-fade-in-up">
          <div className="h-1.5 bg-gradient-to-r from-sky-400 to-blue-600" />
          <div className="relative p-4">
            <button
              type="button"
              onClick={markIntroSeen}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-3 pr-6">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  Butuh Bantuan?
                </p>
                <p className="text-xs text-gray-500">Asisten TCG Marketplace</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Saya siap membantu kamu navigasi TCG Marketplace dengan mudah.
            </p>

            <ul className="text-xs text-gray-500 mb-4 space-y-1.5">
              {INTRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleStartChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mulai Chat
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg items-center justify-center transition-all hover:scale-105"
        aria-label="Bantuan"
      >
        {!introSeen && !open && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
          </span>
        )}
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {open && (
        <div className="hidden md:flex fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[32rem]">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Bantuan</p>
              <p className="text-xs text-blue-100">Asisten TCG Marketplace</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "self-end bg-blue-600 text-white rounded-br-sm"
                    : "self-start bg-gray-100 text-gray-800 rounded-bl-sm",
                )}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-gray-100 rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {limitError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {limitError}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-gray-200 p-3 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tanya sesuatu..."
              disabled={loading || !!limitError}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim() || !!limitError}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
