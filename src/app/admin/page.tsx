import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, Clock, Users, Building2, ScrollText, TrendingUp } from "lucide-react";

export const metadata = { title: "Admin Dashboard — Expert Mobile" };

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay() + 1);

  const [todayBookings, pendingBookings, activeInstallers, totalCustomers, weekBookings, recentAudit] =
    await Promise.all([
      prisma.booking.count({ where: { scheduledStart: { gte: todayStart, lt: todayEnd } } }),
      prisma.booking.count({ where: { status: "pending" } }),
      prisma.user.count({ where: { role: "INSTALLER", isActive: true } }),
      prisma.customer.count(),
      prisma.booking.count({ where: { scheduledStart: { gte: weekStart }, status: { notIn: ["cancelled"] } } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, username: true } } },
      }),
    ]);

  return { todayBookings, pendingBookings, activeInstallers, totalCustomers, weekBookings, recentAudit };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  color?: "primary" | "warning" | "success" | "muted" | "gold";
}) {
  const colorMap = {
    primary: "text-[var(--color-primary)] bg-[var(--color-primary)]/10",
    warning: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
    success: "text-green-600 bg-green-100",
    muted:   "text-[var(--color-text-muted)] bg-gray-100",
    gold:    "text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10",
  };
  return (
    <div className="card stat-card card-lift p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${colorMap[color]} shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        <p className="text-sm text-[var(--color-text-muted)] truncate">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)]/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { todayBookings, pendingBookings, activeInstallers, totalCustomers, weekBookings, recentAudit } =
    await getStats();

  const dateLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{dateLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        <StatCard icon={CalendarDays} label="Jobs Today"       value={todayBookings}    color="primary" />
        <StatCard icon={Clock}        label="Pending"          value={pendingBookings}  color="warning" />
        <StatCard icon={Users}        label="Active Installers" value={activeInstallers} color="success" />
        <StatCard icon={Building2}    label="Customers"        value={totalCustomers}   color="muted" />
      </div>

      {/* Week banner */}
      <div className="card p-4 flex items-center gap-4 animate-fade-up bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent">
        <div className="rounded-xl p-3 bg-[var(--color-primary)]/10 shrink-0">
          <TrendingUp size={20} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            <span className="text-[var(--color-primary)] font-bold text-lg mr-1">{weekBookings}</span>
            bookings this week
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">Week to date (Mon – today)</p>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="card overflow-hidden animate-fade-up">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-border)]">
          <ScrollText size={16} className="text-[var(--color-text-muted)]" />
          <h2 className="font-semibold text-sm text-[var(--color-text)]">Recent Activity</h2>
        </div>
        {recentAudit.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentAudit.map((log) => (
              <li key={log.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-light)] transition-colors">
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
