"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReviewModal } from "./ReviewModal";

interface BuyerReviewButtonProps {
  transactionId: string;
  auctionTitle: string;
  receiptPhotoUrl?: string | null;
  alreadyReviewed: boolean;
}

export function BuyerReviewButton({
  transactionId,
  auctionTitle,
  receiptPhotoUrl,
  alreadyReviewed,
}: BuyerReviewButtonProps) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);
  // Optimistic flip so the UI updates instantly on submit.
  const [reviewedLocal, setReviewedLocal] = useState(false);

  const reviewed = alreadyReviewed || reviewedLocal;

  if (reviewed) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600">
        <Star className="h-3.5 w-3.5 shrink-0 fill-emerald-500 text-emerald-500" />
        <span>Ulasan Anda sudah terkirim. Terima kasih!</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowReview(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
      >
        <Star className="h-4 w-4" />
        Beri Ulasan Penjual
      </button>

      {showReview && (
        <ReviewModal
          transactionId={transactionId}
          auctionTitle={auctionTitle}
          receiptPhotoUrl={receiptPhotoUrl}
          onClose={() => setShowReview(false)}
          onSuccess={() => {
            setShowReview(false);
            setReviewedLocal(true);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
