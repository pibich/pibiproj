import { StreamChat } from "stream-chat";

let client: StreamChat | null = null;

export function getStreamServerClient(): StreamChat {
  if (!client) {
    client = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );
  }
  return client;
}
