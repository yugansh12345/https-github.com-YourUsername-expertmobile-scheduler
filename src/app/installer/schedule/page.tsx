import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ScheduleCalendar, { type CalendarView } from "@/components/ScheduleCalendar";

export const metadata = { title: "Schedule — Installer" };

interface Props {
  searchParams: Promise<{ view?: string; date?: string }>;
}

function getDateRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  if (view === "day") {
    const end = new Date(start); end.setDate(start.getDate() + 1);
    return { start, end };
  }
  if (view === "week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const ws = new Date(start); ws.setDate(start.getDate() + diff);
    const we = new Date(ws); we.setDate(ws.getDate() + 7);
    return { start: ws, end: we };
  }
  const ms = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dow = ms.getDay(); const diff = dow === 0 ? -6 : 1 - dow;
  const gs = new Date(ms); gs.setDate(ms.getDate() + diff);
  const ge = new Date(gs); ge.setDate(gs.getDate() + 42);
  return { start: gs, end: ge };
}

function expandTimeOffToDays(
  records: { startDate: Date; endDate: Date }[],
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  const days: string[] = [];
  for (const r of records) {
    const curr = new Date(Math.max(r.startDate.getTime(), rangeStart.getTime()));
    const stop = new Date(Math.min(r.endDate.getTime(), rangeEnd.getTime()));
    while (curr <= stop) {
      days.push(curr.toISOString().split("T")[0]);
      curr.setDate(curr.getDate() + 1);
    }
  }
  return days;
}

export default async function InstallerSchedulePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { view: viewParam, date: dateParam } = await searchParams;
  const view: CalendarView = (["day", "week", "month"].includes(viewParam ?? "") ? viewParam : "week") as CalendarView;

  const anchorDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  anchorDate.setHours(0, 0, 0, 0);

  const anchor = dateParam ?? (() => {
    if (view === "week") {
      const day = anchorDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const d = new Date(anchorDate); d.setDate(anchorDate.getDate() + diff);
      return d.toISOString().split("T")[0];
    }
    if (view === "month") {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      return d.toISOString().split("T")[0];
    }
    return anchorDate.toISOString().split("T")[0];
  })();

  const { start, end } = getDateRange(view, new Date(anchor + "T00:00:00"));

  const [bookings, installerRecord, approvedTimeOff] = await Promise.all([
    prisma.booking.findMany({
      where: {
        installerId: session.userId,
        scheduledStart: { gte: start, lt: end },
        status: { notIn: ["cancelled"] as never[] },
      },
      orderBy: { scheduledStart: "asc" },
      include: {
        customer: { select: { name: true } },
        installer: { select: { name: true } },
      },
    }),
    prisma.installer.findUnique({
      where: { userId: session.userId },
      select: { defaultWorkingHours: true },
    }),
    prisma.timeOff.findMany({
      where: {
        installerId: session.userId,
        status: "approved",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  const timeOffDays = expandTimeOffToDays(approvedTimeOff, start, end);

  const wh = installerRecord?.defaultWorkingHours as Record<string, string> | null ?? null;
  const lunchBlock =
    wh?.lunchStart && wh?.lunchEnd
      ? { start: wh.lunchStart, end: wh.lunchEnd }
      : null;

  return (
    <div className="max-w-7xl mx-auto">
      <ScheduleCalendar
        bookings={bookings.map((b) => ({
          id: b.id,
          scheduledStart: b.scheduledStart.toISOString(),
          scheduledEnd: b.scheduledEnd.toISOString(),
          timezone: b.timezone,
          status: b.status,
          customerName: b.customer.name,
          installerName: b.installer.name,
          address: b.address,
        }))}
        view={view}
        anchor={anchor}
        basePath="/installer/schedule"
        showInstaller={false}
        timeOffDays={timeOffDays}
        lunchBlock={lunchBlock}
      />
    </div>
  );
}
