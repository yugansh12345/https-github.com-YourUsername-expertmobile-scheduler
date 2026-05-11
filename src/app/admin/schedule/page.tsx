import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Schedule — Admin" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending:     "muted",
  confirmed:   "default",
  on_the_way:  "purple",
  in_progress: "warning",
  completed:   "success",
  cancelled:   "danger",
  no_show:     "muted",
};

interface Props {
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminSchedulePage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;

  const targetDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);

  const prevDay = new Date(targetDate);
  prevDay.setDate(targetDate.getDate() - 1);

  const bookings = await prisma.booking.findMany({
    where: { scheduledStart: { gte: targetDate, lt: nextDate } },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true } },
      installer: { select: { name: true } },
      booker: { select: { name: true } },
    },
  });

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const displayDate = targetDate.toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Schedule</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/schedule?date=${fmt(prevDay)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <Link
            href={`/admin/schedule?date=${fmt(new Date())}`}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
          >
            Today
          </Link>
          <Link
            href={`/admin/schedule?date=${fmt(nextDate)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)]">
            <tr>
              {["Time", "Customer", "Installer", "Booked By", "Status"].map((h) => (
                <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-[var(--color-surface-light)] transition-colors">
                <td className="py-3 px-4 whitespace-nowrap font-medium">
                  {formatTime(b.scheduledStart, b.timezone)} – {formatTime(b.scheduledEnd, b.timezone)}
                </td>
                <td className="py-3 px-4">{b.customer.name}</td>
                <td className="py-3 px-4">{b.installer.name}</td>
                <td className="py-3 px-4 text-[var(--color-text-muted)]">{b.booker.name}</td>
                <td className="py-3 px-4">
                  <Badge variant={STATUS_BADGE[b.status] ?? "muted"}>
                    {b.status.replace(/_/g, " ")}
                  </Badge>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[var(--color-text-muted)]">
                  No bookings scheduled for this day.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
