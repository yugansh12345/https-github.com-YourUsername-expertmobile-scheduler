import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { MapPin, ChevronRight } from "lucide-react";

export const metadata = { title: "My Jobs — Installer" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

const ACTIVE_STATUSES = ["pending", "confirmed", "on_the_way", "in_progress"];

export default async function InstallerDashboardPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Today's jobs
  const todayJobs = await prisma.booking.findMany({
    where: {
      installerId: session.userId,
      scheduledStart: { gte: today, lt: tomorrow },
      status: { notIn: ["cancelled"] as never[] },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true, phone: true } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  // Upcoming (next 7 days, not today)
  const upcomingJobs = await prisma.booking.findMany({
    where: {
      installerId: session.userId,
      scheduledStart: { gte: tomorrow, lt: nextWeek },
      status: { notIn: ["cancelled"] as never[] },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true } },
      services: { include: { service: { select: { name: true } } } },
    },
    take: 10,
  });

  const activeCount = todayJobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length;

  const fmtDate = (d: Date, tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, weekday: "short", month: "short", day: "numeric",
    }).format(new Date(d));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <AnnouncementBanner audience="INSTALLERS" />
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{todayJobs.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Jobs Today</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">{activeCount}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Active</p>
        </div>
      </div>

      {/* Today */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
          Today — {today.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        {todayJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
            No jobs scheduled for today.
          </div>
        ) : (
          <div className="space-y-2">
            {todayJobs.map((job) => (
              <Link
                key={job.id}
                href={`/installer/jobs/${job.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {formatTime(job.scheduledStart, job.timezone)}
                    </span>
                    <Badge variant={STATUS_BADGE[job.status] ?? "muted"}>
                      {job.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="font-medium mt-0.5">{job.customer.name}</p>
                  {job.address && (
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {job.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.services.slice(0, 2).map((bs) => (
                      <Badge key={bs.id} variant="muted">{bs.service.name}</Badge>
                    ))}
                    {job.services.length > 2 && (
                      <span className="text-xs text-[var(--color-text-muted)]">+{job.services.length - 2} more</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingJobs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
            Coming Up
          </h2>
          <div className="space-y-2">
            {upcomingJobs.map((job) => (
              <Link
                key={job.id}
                href={`/installer/jobs/${job.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-[var(--color-border)] p-4 hover:border-[var(--color-primary)]/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {fmtDate(job.scheduledStart, job.timezone)} · {formatTime(job.scheduledStart, job.timezone)}
                  </p>
                  <p className="font-medium">{job.customer.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.services.slice(0, 2).map((bs) => (
                      <Badge key={bs.id} variant="muted">{bs.service.name}</Badge>
                    ))}
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[job.status] ?? "muted"}>{job.status.replace(/_/g, " ")}</Badge>
                <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
