import "stream-chat";

declare module "stream-chat" {
  interface CustomUserData {
    buyer_warning_count?: number;
  }

  interface CustomChannelData {
    name?: string;
  }
}
