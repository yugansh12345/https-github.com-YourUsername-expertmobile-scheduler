"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Coffee, CalendarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_COLORS } from "@/lib/utils";

export type CalendarView = "day" | "week" | "month";

export interface CalendarBooking {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  status: string;
  customerName: string;
  installerName: string;
  address?: string | null;
}

interface Props {
  bookings: CalendarBooking[];
  view: CalendarView;
  anchor: string; // YYYY-MM-DD
  basePath: string;
  showInstaller?: boolean;
  timeOffDays?: string[]; // YYYY-MM-DD days blocked as time-off
  lunchBlock?: { start: string; end: string } | null; // HH:MM
}

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

function fmt(d: Date) { return d.toISOString().split("T")[0]; }

function parseLocal(dateStr: string) {
  return new Date(dateStr + "T00:00:00");
}

function getWeekStart(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getMonthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function fmtTime(dateStr: string, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
}

function fmtShortDate(d: Date) {
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function fmtLongDate(d: Date) {
  return d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function bookingDay(b: CalendarBooking) {
  return new Date(b.scheduledStart).toISOString().split("T")[0];
}

function fmtHHMM(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

// ─── Booking Pill ─────────────────────────────────────────────────────────────

function BookingPill({ b, basePath, compact = false }: { b: CalendarBooking; basePath: string; compact?: boolean }) {
  const color = BOOKING_STATUS_COLORS[b.status] ?? "#6C757D";
  const jobPath = basePath.includes("installer") ? `/installer/jobs/${b.id}` : null;

  const content = (
    <div
      className="rounded px-1.5 py-0.5 text-white text-xs truncate cursor-pointer hover:opacity-90 transition-opacity"
      style={{ backgroundColor: color }}
      title={`${b.customerName} — ${fmtTime(b.scheduledStart, b.timezone)}`}
    >
      {compact ? b.customerName : `${fmtTime(b.scheduledStart, b.timezone)} ${b.customerName}`}
    </div>
  );

  if (jobPath) return <Link href={jobPath}>{content}</Link>;
  return content;
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  bookings, anchor, basePath, lunchBlock, timeOffDays,
}: {
  bookings: CalendarBooking[];
  anchor: string;
  basePath: string;
  lunchBlock?: { start: string; end: string } | null;
  timeOffDays?: string[];
}) {
  const isOff = timeOffDays?.includes(anchor);

  if (isOff) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 py-16 text-center space-y-2">
        <CalendarOff size={36} className="mx-auto text-amber-400" />
        <p className="font-semibold text-amber-700">Day Off</p>
        <p className="text-sm text-[var(--color-text-muted)]">This day is a scheduled time off.</p>
      </div>
    );
  }

  const dayBookings = bookings
    .filter(b => bookingDay(b) === anchor)
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  if (dayBookings.length === 0 && !lunchBlock) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] py-16 text-center text-[var(--color-text-muted)] text-sm">
        No bookings scheduled for this day.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lunchBlock && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <Coffee size={15} />
          <span className="font-medium">Lunch Break</span>
          <span>{fmtHHMM(lunchBlock.start)} – {fmtHHMM(lunchBlock.end)}</span>
        </div>
      )}

      {dayBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] py-10 text-center text-[var(--color-text-muted)] text-sm">
          No bookings scheduled for this day.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-light)]">
              <tr>
                {["Time", "Customer", "Installer", "Status", "Address"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide first:w-36">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {dayBookings.map((b) => {
                const jobPath = basePath.includes("installer") ? `/installer/jobs/${b.id}` : null;
                const row = (
                  <tr key={b.id} className={`hover:bg-[var(--color-surface-light)] transition-colors ${jobPath ? "cursor-pointer" : ""}`}>
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      {fmtTime(b.scheduledStart, b.timezone)} – {fmtTime(b.scheduledEnd, b.timezone)}
                    </td>
                    <td className="py-3 px-4 font-medium">{b.customerName}</td>
                    <td className="py-3 px-4 text-[var(--color-text-muted)]">{b.installerName}</td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_BADGE[b.status] ?? "muted"}>
                        {b.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-muted)] text-xs max-w-[180px] truncate">{b.address ?? "—"}</td>
                  </tr>
                );
                return jobPath ? <Link key={b.id} href={jobPath} className="contents">{row}</Link> : row;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  bookings, anchor, basePath, lunchBlock, timeOffDays,
}: {
  bookings: CalendarBooking[];
  anchor: string;
  basePath: string;
  lunchBlock?: { start: string; end: string } | null;
  timeOffDays?: string[];
}) {
  const weekStart = getWeekStart(parseLocal(anchor));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = fmt(new Date());
  const offSet = new Set(timeOffDays ?? []);

  return (
    <div className="grid grid-cols-7 gap-0 bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      {days.map((d) => {
        const key = fmt(d);
        const isToday = key === todayKey;
        return (
          <div
            key={key}
            className={`px-2 py-2 text-center border-b border-[var(--color-border)] ${isToday ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-light)]"}`}
          >
            <p className={`text-xs font-semibold ${isToday ? "text-white" : "text-[var(--color-text-muted)]"}`}>
              {d.toLocaleDateString("en-CA", { weekday: "short" })}
            </p>
            <p className={`text-lg font-bold ${isToday ? "text-white" : "text-[var(--color-text)]"}`}>
              {d.getDate()}
            </p>
          </div>
        );
      })}

      {/* Day columns */}
      {days.map((d) => {
        const key = fmt(d);
        const isOff = offSet.has(key);
        const dayBookings = bookings
          .filter(b => bookingDay(b) === key)
          .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

        if (isOff) {
          return (
            <div key={key} className="min-h-[120px] p-1.5 bg-amber-50/60 border-r border-[var(--color-border)] last:border-r-0 flex flex-col items-center justify-center gap-1">
              <CalendarOff size={16} className="text-amber-400" />
              <p className="text-xs text-amber-600 font-medium">Day Off</p>
            </div>
          );
        }

        return (
          <div key={key} className="min-h-[120px] p-1.5 space-y-1 border-r border-[var(--color-border)] last:border-r-0">
            {dayBookings.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-3">—</p>
            ) : (
              dayBookings.map((b) => (
                <BookingPill key={b.id} b={b} basePath={basePath} compact />
              ))
            )}
            {lunchBlock && (
              <div className="rounded px-1.5 py-0.5 text-xs text-amber-700 bg-amber-100 border border-amber-200 flex items-center gap-1 truncate mt-1">
                <Coffee size={10} className="shrink-0" />
                <span className="truncate">{fmtHHMM(lunchBlock.start)}–{fmtHHMM(lunchBlock.end)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  bookings, anchor, basePath, timeOffDays,
}: {
  bookings: CalendarBooking[];
  anchor: string;
  basePath: string;
  timeOffDays?: string[];
}) {
  const anchorDate = parseLocal(anchor);
  const monthStart = getMonthStart(anchorDate);
  const calStart = getWeekStart(monthStart);
  const todayKey = fmt(new Date());
  const offSet = new Set(timeOffDays ?? []);

  const cells = Array.from({ length: 42 }, (_, i) => addDays(calStart, i));

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase bg-[var(--color-surface-light)]">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          const key = fmt(d);
          const isToday = key === todayKey;
          const isOff = offSet.has(key);
          const isCurrentMonth = d.getMonth() === anchorDate.getMonth();
          const dayBookings = bookings
            .filter(b => bookingDay(b) === key)
            .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
          const extra = dayBookings.length > 3 ? dayBookings.length - 3 : 0;

          return (
            <div
              key={key}
              className={[
                "min-h-[100px] p-1.5 border-b border-r border-[var(--color-border)]",
                idx % 7 === 6 ? "border-r-0" : "",
                isOff ? "bg-amber-50/70" : !isCurrentMonth ? "bg-gray-50/50" : "",
              ].join(" ")}
            >
              <Link href={`${basePath}?view=day&date=${key}`}>
                <span className={[
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1",
                  isToday ? "bg-[var(--color-primary)] text-white" : isCurrentMonth ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]",
                  "hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer",
                ].join(" ")}>
                  {d.getDate()}
                </span>
              </Link>

              {isOff && isCurrentMonth && (
                <div className="flex items-center gap-0.5 mb-0.5">
                  <CalendarOff size={10} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-600 font-medium">Day Off</span>
                </div>
              )}

              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <BookingPill key={b.id} b={b} basePath={basePath} compact />
                ))}
                {extra > 0 && (
                  <Link href={`${basePath}?view=day&date=${key}`}>
                    <p className="text-xs text-[var(--color-primary)] hover:underline pl-1">+{extra} more</p>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Calendar Component ──────────────────────────────────────────────────

export default function ScheduleCalendar({
  bookings, view, anchor, basePath, showInstaller = true,
  timeOffDays, lunchBlock,
}: Props) {
  const router = useRouter();
  const anchorDate = parseLocal(anchor);

  function getPrev() {
    if (view === "day") return fmt(addDays(anchorDate, -1));
    if (view === "week") return fmt(addDays(getWeekStart(anchorDate), -7));
    const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    return fmt(d);
  }

  function getNext() {
    if (view === "day") return fmt(addDays(anchorDate, 1));
    if (view === "week") return fmt(addDays(getWeekStart(anchorDate), 7));
    const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    return fmt(d);
  }

  function getTodayAnchor() {
    if (view === "week") return fmt(getWeekStart(new Date()));
    if (view === "month") return fmt(getMonthStart(new Date()));
    return fmt(new Date());
  }

  function getTitle() {
    if (view === "day") return fmtLongDate(anchorDate);
    if (view === "week") {
      const start = getWeekStart(anchorDate);
      const end = addDays(start, 6);
      return `${fmtShortDate(start)} – ${fmtShortDate(end)}, ${end.getFullYear()}`;
    }
    return anchorDate.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  }

  const prevAnchor  = getPrev();
  const nextAnchor  = getNext();
  const todayAnchor = getTodayAnchor();

  // suppress unused-var warning — showInstaller wired to future table column
  void showInstaller;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Schedule</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{getTitle()}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden shadow-sm">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => router.push(`${basePath}?view=${v}&date=${anchor}`)}
                className={[
                  "px-3 py-1.5 text-sm capitalize transition-colors border-r last:border-r-0 border-[var(--color-border)]",
                  view === v
                    ? "bg-[var(--color-primary)] text-white"
                    : "hover:bg-[var(--color-surface-light)] text-[var(--color-text)]",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Link
              href={`${basePath}?view=${view}&date=${prevAnchor}`}
              className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
            <Link
              href={`${basePath}?view=${view}&date=${todayAnchor}`}
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
            >
              Today
            </Link>
            <Link
              href={`${basePath}?view=${view}&date=${nextAnchor}`}
              className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-light)] transition-colors"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Legend for time-off / lunch */}
      {(timeOffDays && timeOffDays.length > 0 || lunchBlock) && (
        <div className="flex flex-wrap gap-3 text-xs">
          {timeOffDays && timeOffDays.length > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
              <CalendarOff size={12} /> Time Off
            </span>
          )}
          {lunchBlock && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
              <Coffee size={12} /> Lunch {fmtHHMM(lunchBlock.start)}–{fmtHHMM(lunchBlock.end)}
            </span>
          )}
        </div>
      )}

      {/* Calendar body */}
      {view === "day"   && <DayView   bookings={bookings} anchor={anchor} basePath={basePath} lunchBlock={lunchBlock} timeOffDays={timeOffDays} />}
      {view === "week"  && <WeekView  bookings={bookings} anchor={anchor} basePath={basePath} lunchBlock={lunchBlock} timeOffDays={timeOffDays} />}
      {view === "month" && <MonthView bookings={bookings} anchor={anchor} basePath={basePath} timeOffDays={timeOffDays} />}
    </div>
  );
}
