import { prisma } from "@/lib/prisma";
import ScheduleCalendar, { type CalendarView } from "@/components/ScheduleCalendar";

export const metadata = { title: "Schedule — Admin" };

interface Props {
  searchParams: Promise<{ view?: string; date?: string }>;
}

function getDateRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);

  if (view === "day") {
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }

  if (view === "week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return { start: weekStart, end: weekEnd };
  }

  // month — fetch full 6-week grid (42 days from Monday before month start)
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const dayOfWeek = monthStart.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() + diff);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 42);
  return { start: gridStart, end: gridEnd };
}

export default async function AdminSchedulePage({ searchParams }: Props) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view: CalendarView = (["day", "week", "month"].includes(viewParam ?? "") ? viewParam : "week") as CalendarView;

  const anchorDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  anchorDate.setHours(0, 0, 0, 0);

  // For week view default to Monday of current week
  const anchor = dateParam ?? (() => {
    if (view === "week") {
      const day = anchorDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() + diff);
      return d.toISOString().split("T")[0];
    }
    if (view === "month") {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
      return d.toISOString().split("T")[0];
    }
    return anchorDate.toISOString().split("T")[0];
  })();

  const { start, end } = getDateRange(view, new Date(anchor + "T00:00:00"));

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledStart: { gte: start, lt: end },
      status: { notIn: ["cancelled"] as never[] },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: { select: { name: true } },
      installer: { select: { name: true } },
    },
  });

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
        basePath="/admin/schedule"
        showInstaller
      />
    </div>
  );
}
