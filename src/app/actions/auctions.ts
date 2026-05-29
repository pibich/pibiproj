"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/dal";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/server";

/** Admin atau middleman boleh meninjau lelang. */
async function requireApprover() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "admin" && !user.is_middleman) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function approveAuctionAction(
  auctionId: string,
): Promise<{ error?: string }> {
  let reviewer: Awaited<ReturnType<typeof requireApprover>>;
  try {
    reviewer = await requireApprover();
  } catch {
    return { error: "Anda tidak memiliki akses untuk menyetujui lelang." };
  }

  const adminDb = createAdminClient();

  const { data: auction } = await adminDb
    .from("auctions")
    .select("id, seller_id, status, end_time")
    .eq("id", auctionId)
    .single();

  if (!auction) return { error: "Lelang tidak ditemukan." };
  if (auction.status !== "pending_approval") {
    return { error: "Lelang ini sudah ditinjau." };
  }
  // Jika durasi sudah lewat saat ditinjau, lelang tidak bisa langsung aktif.
  if (auction.end_time && new Date(auction.end_time) <= new Date()) {
    return {
      error:
        "Waktu selesai lelang sudah lewat. Minta penjual membuat ulang lelang.",
    };
  }

  const { error } = await adminDb
    .from("auctions")
    .update({
      status: "active",
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", auctionId);

  if (error) return { error: "Gagal menyetujui lelang." };

  await createNotification(adminDb, {
    user_id: auction.seller_id,
    type: "auction_approved",
    auction_id: auctionId,
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/middleman/dashboard");
  revalidatePath(`/auctions/${auctionId}`);
  revalidatePath("/auctions");

  return {};
}

export async function rejectAuctionAction(
  auctionId: string,
  reason: string,
): Promise<{ error?: string }> {
  let reviewer: Awaited<ReturnType<typeof requireApprover>>;
  try {
    reviewer = await requireApprover();
  } catch {
    return { error: "Anda tidak memiliki akses untuk menolak lelang." };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return { error: "Alasan penolakan minimal 5 karakter." };
  }

  const adminDb = createAdminClient();

  const { data: auction } = await adminDb
    .from("auctions")
    .select("id, seller_id, status")
    .eq("id", auctionId)
    .single();

  if (!auction) return { error: "Lelang tidak ditemukan." };
  if (auction.status !== "pending_approval") {
    return { error: "Lelang ini sudah ditinjau." };
  }

  const { error } = await adminDb
    .from("auctions")
    .update({
      status: "rejected",
      rejection_reason: trimmed,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", auctionId);

  if (error) return { error: "Gagal menolak lelang." };

  await createNotification(adminDb, {
    user_id: auction.seller_id,
    type: "auction_rejected",
    auction_id: auctionId,
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/middleman/dashboard");
  revalidatePath(`/auctions/${auctionId}`);

  return {};
}
