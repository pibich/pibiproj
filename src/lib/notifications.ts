import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type NotificationType =
  | "auction_won"
  | "auction_ended"
  | "transaction_confirmed"
  | "awaiting_shipment"
  | "shipping_proof_submitted"
  | "delivery_confirmed"
  | "funds_released"
  | "confirmation_expired"
  | "auction_approved"
  | "auction_rejected";

export async function createNotification(
  supabase: SupabaseClient<Database>,
  payload: {
    user_id: string;
    type: NotificationType;
    auction_id?: string;
  },
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: payload.user_id,
    type: payload.type,
    auction_id: payload.auction_id ?? null,
  });
  // ON CONFLICT DO NOTHING handled by UNIQUE (user_id, type, auction_id) constraint
}
