import { type NextRequest, NextResponse } from "next/server";
import { createGeminiClient } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

const AUTH_LIMIT = 15;
const GUEST_LIMIT = 5;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json();
  const { message, history, sessionId } = body as {
    message: string;
    history?: { role: "user" | "model"; parts: { text: string }[] }[];
    sessionId?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const limit = user ? AUTH_LIMIT : GUEST_LIMIT;

  // Check & increment rate limit
  if (user) {
    const { data: usage } = await supabase
      .from("chatbot_usage")
      .select("id, message_count")
      .eq("user_id", user.id)
      .eq("reset_date", today)
      .single();

    if (usage) {
      if (usage.message_count >= limit) {
        return NextResponse.json(
          { error: `Batas pesan harian tercapai (${limit} pesan/hari)` },
          { status: 429 },
        );
      }
      await supabase
        .from("chatbot_usage")
        .update({ message_count: usage.message_count + 1 })
        .eq("id", usage.id);
    } else {
      await supabase.from("chatbot_usage").insert({
        user_id: user.id,
        message_count: 1,
        reset_date: today,
      });
    }
  } else if (sessionId) {
    const { data: usage } = await supabase
      .from("chatbot_usage")
      .select("id, message_count")
      .eq("session_id", sessionId)
      .eq("reset_date", today)
      .single();

    if (usage) {
      if (usage.message_count >= limit) {
        return NextResponse.json(
          {
            error: `Batas pesan tercapai (${limit} pesan/sesi). Daftar untuk mendapatkan lebih banyak.`,
          },
          { status: 429 },
        );
      }
      await supabase
        .from("chatbot_usage")
        .update({ message_count: usage.message_count + 1 })
        .eq("id", usage.id);
    } else {
      await supabase.from("chatbot_usage").insert({
        session_id: sessionId,
        message_count: 1,
        reset_date: today,
      });
    }
  }

  try {
    const model = createGeminiClient();
    const chat = model.startChat({
      history: history ?? [],
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "Gagal menghubungi asisten. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
