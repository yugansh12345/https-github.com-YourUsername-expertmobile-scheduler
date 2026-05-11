import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Reports — Admin" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending:     "muted",
  confirmed:   "default",
  on_the_way:  "purple",
  in_progress: "warning",
  completed:   "success",
  cancelled:   "danger",
  no_show:     "muted",
};

export default async function AdminReportsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [bookingsByStatus, installerStats, monthlyRevenue, lastMonthRevenue] = await Promise.all([
    // Count by status
    prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Count by installer (top 10)
    prisma.booking.groupBy({
      by: ["installerId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Revenue this month (completed bookings)
    prisma.booking.aggregate({
      where: { status: "completed", scheduledStart: { gte: monthStart } },
      _sum: { totalPrice: true },
      _count: { id: true },
    }),
    // Revenue last month
    prisma.booking.aggregate({
      where: { status: "completed", scheduledStart: { gte: prevMonthStart, lt: monthStart } },
      _sum: { totalPrice: true },
      _count: { id: true },
    }),
  ]);

  // Resolve installer names
  const installerIds = installerStats.map((s) => s.installerId);
  const installers = await prisma.user.findMany({
    where: { id: { in: installerIds } },
    select: { id: true, name: true },
  });
  const installerMap = Object.fromEntries(installers.map((u) => [u.id, u.name]));

  const thisMonthRevenue = monthlyRevenue._sum.totalPrice?.toString() ?? "0";
  const prevRevenue = lastMonthRevenue._sum.totalPrice?.toString() ?? "0";

  const totalBookings = bookingsByStatus.reduce((sum, s) => sum + s._count.id, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Reports</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {now.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">This Month Revenue</p>
          <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
            ${parseFloat(thisMonthRevenue).toFixed(2)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{monthlyRevenue._count.id} completed jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Last Month Revenue</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
            ${parseFloat(prevRevenue).toFixed(2)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{lastMonthRevenue._count.id} completed jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Total Bookings</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{totalBookings}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">all time</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings by status */}
        <div className="bg-white rounded-xl border border-[var(--color-border)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-sm">Bookings by Status</h2>
          </div>
          {bookingsByStatus.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {bookingsByStatus.map((s) => (
                <li key={s.status} className="px-5 py-3 flex items-center justify-between">
                  <Badge variant={STATUS_BADGE[s.status] ?? "muted"}>
                    {s.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="font-semibold text-[var(--color-text)]">{s._count.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top installers */}
        <div className="bg-white rounded-xl border border-[var(--color-border)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-sm">Top Installers by Bookings</h2>
          </div>
          {installerStats.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">No data yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {installerStats.map((s, i) => (
                <li key={s.installerId} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] w-4">{i + 1}</span>
                    <span className="font-medium text-sm">
                      {installerMap[s.installerId] ?? s.installerId}
                    </span>
                  </div>
                  <span className="font-semibold text-[var(--color-text)]">{s._count.id} jobs</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
