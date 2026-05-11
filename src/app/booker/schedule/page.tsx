import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CancelBookingButton from "./CancelBookingButton";

export const metadata = { title: "Schedule — Booker" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function BookerSchedulePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { date: dateParam } = await searchParams;
  const targetDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate); nextDate.setDate(targetDate.getDate() + 1);
  const prevDay = new Date(targetDate); prevDay.setDate(targetDate.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: {
      bookerId: session.userId,
      scheduledStart: { gte: targetDate, lt: nextDate },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      installer: { select: { name: true } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  const displayDate = targetDate.toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">My Schedule</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/booker/schedule?date=${fmt(prevDay)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            <ChevronLeft size={16} />
          </Link>
          <Link href="/booker/schedule"
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            Today
          </Link>
          <Link href={`/booker/schedule?date=${fmt(nextDate)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] py-12 text-center text-[var(--color-text-muted)]">
          No bookings scheduled for this day.{" "}
          <Link href="/booker/new" className="text-[var(--color-primary)] hover:underline">Create one?</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {formatTime(b.scheduledStart, b.timezone)} – {formatTime(b.scheduledEnd, b.timezone)}
                    </span>
                    <Badge variant={STATUS_BADGE[b.status] ?? "muted"}>
                      {b.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="font-medium">{b.customer.name}</p>
                  {b.customer.phone && (
                    <p className="text-sm text-[var(--color-text-muted)]">{b.customer.phone}</p>
                  )}
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Installer: <span className="font-medium text-[var(--color-text)]">{b.installer.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {b.services.map((bs) => (
                      <Badge key={bs.id} variant="muted">{bs.service.name}</Badge>
                    ))}
                  </div>
                </div>
                {CANCELLABLE.has(b.status) && (
                  <CancelBookingButton bookingId={b.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
