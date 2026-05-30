export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          username: string;
          email: string;
          phone: string;
          province: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          buyer_warning_count: number;
          buyer_timeout_until: string | null;
          is_middleman: boolean;
          is_active: boolean;
          successful_purchases: number;
          successful_sales: number;
          created_at: string;
          facebook_name: string | null;
          facebook_public: boolean;
        };
        Insert: {
          id: string;
          name: string;
          username: string;
          email: string;
          phone: string;
          province?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          buyer_warning_count?: number;
          buyer_timeout_until?: string | null;
          is_middleman?: boolean;
          is_active?: boolean;
          successful_purchases?: number;
          successful_sales?: number;
          created_at?: string;
          facebook_name?: string | null;
          facebook_public?: boolean;
        };
        Update: {
          name?: string;
          province?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          buyer_warning_count?: number;
          buyer_timeout_until?: string | null;
          is_middleman?: boolean;
          is_active?: boolean;
          successful_purchases?: number;
          successful_sales?: number;
          facebook_name?: string | null;
          facebook_public?: boolean;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      auctions: {
        Row: {
          id: string;
          seller_id: string;
          category_id: string;
          title: string;
          description: string | null;
          condition:
            | "mint"
            | "near_mint"
            | "excellent"
            | "good"
            | "light_play"
            | "heavy_play"
            | "damaged";
          images: string[];
          starting_price: number;
          current_price: number;
          buy_now_price: number | null;
          min_bid_increment: number;
          free_shipping: boolean;
          status:
            | "draft"
            | "active"
            | "closed"
            | "completed"
            | "cancelled"
            | "pending_approval"
            | "rejected";
          start_time: string | null;
          end_time: string | null;
          winner_id: string | null;
          view_count: number;
          transaction_confirmed: boolean;
          confirmation_deadline: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          condition:
            | "mint"
            | "near_mint"
            | "excellent"
            | "good"
            | "light_play"
            | "heavy_play"
            | "damaged";
          images?: string[];
          starting_price: number;
          current_price: number;
          buy_now_price?: number | null;
          min_bid_increment?: number;
          free_shipping?: boolean;
          status?:
            | "draft"
            | "active"
            | "closed"
            | "completed"
            | "cancelled"
            | "pending_approval"
            | "rejected";
          start_time?: string | null;
          end_time?: string | null;
          winner_id?: string | null;
          view_count?: number;
          transaction_confirmed?: boolean;
          confirmation_deadline?: string | null;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          condition?:
            | "mint"
            | "near_mint"
            | "excellent"
            | "good"
            | "light_play"
            | "heavy_play"
            | "damaged";
          images?: string[];
          buy_now_price?: number | null;
          min_bid_increment?: number;
          free_shipping?: boolean;
          status?:
            | "draft"
            | "active"
            | "closed"
            | "completed"
            | "cancelled"
            | "pending_approval"
            | "rejected";
          start_time?: string | null;
          end_time?: string | null;
          current_price?: number;
          winner_id?: string | null;
          view_count?: number;
          transaction_confirmed?: boolean;
          confirmation_deadline?: string | null;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bids: {
        Row: {
          id: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          is_winning: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          is_winning?: boolean;
          created_at?: string;
        };
        Update: {
          is_winning?: boolean;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          auction_id: string | null;
          reason:
            | "bid_run"
            | "seller_close_no_reason"
            | "fraud"
            | "scam"
            | "no_payment"
            | "other";
          description: string | null;
          status: "pending" | "reviewed" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          auction_id?: string | null;
          reason:
            | "bid_run"
            | "seller_close_no_reason"
            | "fraud"
            | "scam"
            | "no_payment"
            | "other";
          description?: string | null;
          status?: "pending" | "reviewed" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "reviewed" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          auction_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auction_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      chatbot_usage: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          message_count: number;
          reset_date: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          message_count?: number;
          reset_date?: string;
        };
        Update: {
          message_count?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "auction_won"
            | "auction_ended"
            | "transaction_confirmed"
            | "awaiting_shipment"
            | "shipping_proof_submitted"
            | "delivery_confirmed"
            | "funds_released"
            | "confirmation_expired"
            | "auction_pending_approval"
            | "auction_approved"
            | "auction_rejected";
          auction_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "auction_won"
            | "auction_ended"
            | "transaction_confirmed"
            | "awaiting_shipment"
            | "shipping_proof_submitted"
            | "delivery_confirmed"
            | "funds_released"
            | "confirmation_expired"
            | "auction_pending_approval"
            | "auction_approved"
            | "auction_rejected";
          auction_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          auction_id: string;
          seller_id: string;
          buyer_id: string;
          middleman_id: string | null;
          amount: number;
          tax_bearer: "Buyer" | "Seller" | "Buyer & Seller";
          status:
            | "awaiting_payment"
            | "awaiting_shipment"
            | "shipped"
            | "delivery_confirmed"
            | "completed"
            | "cancelled";
          shipping_photo_url: string | null;
          shipping_tracking_number: string | null;
          shipping_notes: string | null;
          shipping_submitted_at: string | null;
          receipt_photo_url: string | null;
          receipt_notes: string | null;
          receipt_submitted_at: string | null;
          stream_channel_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          seller_id: string;
          buyer_id: string;
          middleman_id?: string | null;
          amount: number;
          tax_bearer?: "Buyer" | "Seller" | "Buyer & Seller";
          status?: "awaiting_payment" | "awaiting_shipment" | "shipped" | "delivery_confirmed" | "completed" | "cancelled";
          shipping_photo_url?: string | null;
          shipping_tracking_number?: string | null;
          shipping_notes?: string | null;
          shipping_submitted_at?: string | null;
          receipt_photo_url?: string | null;
          receipt_notes?: string | null;
          receipt_submitted_at?: string | null;
          stream_channel_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          middleman_id?: string | null;
          status?: "awaiting_payment" | "awaiting_shipment" | "shipped" | "delivery_confirmed" | "completed" | "cancelled";
          shipping_photo_url?: string | null;
          shipping_tracking_number?: string | null;
          shipping_notes?: string | null;
          shipping_submitted_at?: string | null;
          receipt_photo_url?: string | null;
          receipt_notes?: string | null;
          receipt_submitted_at?: string | null;
          stream_channel_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      buyer_warnings: {
        Row: {
          id: string;
          user_id: string;
          auction_id: string | null;
          note: string | null;
          auto_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auction_id?: string | null;
          note?: string | null;
          auto_generated?: boolean;
          created_at?: string;
        };
        Update: {
          note?: string | null;
        };
        Relationships: [];
      };
      blacklist: {
        Row: {
          id: string;
          user_id: string | null;
          type: "auto" | "manual";
          name: string | null;
          username: string | null;
          email: string | null;
          phone: string | null;
          reason: string | null;
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: "auto" | "manual";
          name?: string | null;
          username?: string | null;
          email?: string | null;
          phone?: string | null;
          reason?: string | null;
          added_by?: string | null;
          created_at?: string;
        };
        Update: {
          type?: "auto" | "manual";
          reason?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Auction = Database["public"]["Tables"]["auctions"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type WatchlistItem = Database["public"]["Tables"]["watchlist"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type BuyerWarning = Database["public"]["Tables"]["buyer_warnings"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionStatus = Transaction["status"];
