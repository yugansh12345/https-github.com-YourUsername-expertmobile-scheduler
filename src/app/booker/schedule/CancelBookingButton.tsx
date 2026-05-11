"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction } from "@/app/actions/bookings";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    startTransition(async () => {
      await cancelBookingAction(bookingId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
