import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, Clock, Users, Building2, ScrollText } from "lucide-react";

export const metadata = { title: "Admin Dashboard — Expert Mobile" };

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const [todayBookings, pendingBookings, activeInstallers, totalCustomers, recentAudit] =
    await Promise.all([
      prisma.booking.count({ where: { scheduledStart: { gte: todayStart, lt: todayEnd } } }),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.user.count({ where: { role: "INSTALLER", isActive: true } }),
      prisma.customer.count(),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, username: true } } },
      }),
    ]);

  return { todayBookings, pendingBookings, activeInstallers, totalCustomers, recentAudit };
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color?: "primary" | "warning" | "success" | "muted";
}) {
  const colorMap = {
    primary: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
    warning: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
    success: "text-green-600 bg-green-100",
    muted: "text-[var(--color-text-muted)] bg-gray-100",
  };
  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex items-center gap-4">
      <div className={`rounded-lg p-3 ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { todayBookings, pendingBookings, activeInstallers, totalCustomers, recentAudit } =
    await getStats();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {new Date().toLocaleDateString("en-CA", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Jobs Today"       value={todayBookings}    color="primary" />
        <StatCard icon={Clock}        label="Pending"          value={pendingBookings}  color="warning" />
        <StatCard icon={Users}        label="Active Installers" value={activeInstallers} color="success" />
        <StatCard icon={Building2}    label="Customers"        value={totalCustomers}   color="muted" />
      </div>

      {/* Recent Audit Log */}
      <div className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-border)]">
          <ScrollText size={16} className="text-[var(--color-text-muted)]" />
          <h2 className="font-semibold text-sm text-[var(--color-text)]">Recent Activity</h2>
        </div>
        {recentAudit.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentAudit.map((log) => (
              <li key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {log.user.name ?? log.user.username}
                  </span>
                  <span className="mx-2 text-[var(--color-text-muted)]">·</span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {log.action.replace(/_/g, " ").toLowerCase()}
                  </span>
                  {log.entityType && (
                    <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                      ({log.entityType})
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
