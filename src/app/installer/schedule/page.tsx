import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Schedule — Installer" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function InstallerSchedulePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { week: weekParam } = await searchParams;

  // Compute start of the target week (Monday)
  const base = weekParam ? new Date(weekParam + "T00:00:00") : new Date();
  const dayOfWeek = base.getDay(); // 0=Sun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(weekStart.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(weekStart.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: {
      installerId: session.userId,
      scheduledStart: { gte: weekStart, lt: weekEnd },
      status: { notIn: ["cancelled"] as never[] },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  // Group by day
  const days: { date: Date; label: string; dayKey: string; jobs: typeof bookings }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayKey = fmt(d);
    const label = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
    const jobs = bookings.filter((b) => fmt(new Date(b.scheduledStart)) === dayKey);
    days.push({ date: d, label, dayKey, jobs });
  }

  const weekLabel = `${weekStart.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 86400000).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Schedule</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/installer/schedule?week=${fmt(prevWeek)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            <ChevronLeft size={16} />
          </Link>
          <Link href="/installer/schedule"
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            This Week
          </Link>
          <Link href={`/installer/schedule?week=${fmt(nextWeek)}`}
            className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {days.map(({ label, dayKey, jobs }) => {
        const isToday = dayKey === fmt(new Date());
        return (
          <div key={dayKey} className={`bg-white rounded-xl border ${isToday ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"} overflow-hidden`}>
            <div className={`px-4 py-2 ${isToday ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-light)]"}`}>
              <span className="text-sm font-semibold">{label}</span>
              {isToday && <span className="ml-2 text-xs opacity-80">Today</span>}
            </div>
            {jobs.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No jobs</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/installer/jobs/${job.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-light)] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{formatTime(job.scheduledStart, job.timezone)}</span>
                        <Badge variant={STATUS_BADGE[job.status] ?? "muted"}>
                          {job.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)]">{job.customer.name}</p>
                      {job.services.length > 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {job.services.map((bs) => bs.service.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
