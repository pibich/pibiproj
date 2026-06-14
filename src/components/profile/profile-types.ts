import type {
  Auction,
  Category,
  Profile,
  TransactionStatus,
} from "@/types/supabase";

export type AuctionWithRelations = Auction & {
  seller: Pick<Profile, "username" | "name">;
  winner: Pick<Profile, "username" | "name"> | null;
  category: Pick<Category, "name" | "slug">;
  _count: { bids: number };
};

export type ProfileTransaction = {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  middleman_id: string | null;
  amount: number;
  status: TransactionStatus;
  shipping_tracking_number: string | null;
  shipping_photo_url: string | null;
  receipt_photo_url: string | null;
  stream_channel_id: string | null;
  reviewed?: boolean;
  auction: { id: string; title: string; images: string[] } | null;
  seller: { id: string; username: string; name: string } | null;
  buyer: { id: string; username: string; name: string } | null;
  middleman: { id: string; username: string; name: string } | null;
};

export type BidWithAuction = {
  id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
  auction: Pick<
    Auction,
    | "id"
    | "title"
    | "current_price"
    | "status"
    | "end_time"
    | "images"
    | "winner_id"
    | "transaction_confirmed"
  > | null;
};

export type WonAuction = {
  id: string;
  title: string;
  images: string[] | null;
  current_price: number;
  seller_id: string;
  confirmation_deadline: string | null;
  seller: { username: string; name: string } | null;
};
