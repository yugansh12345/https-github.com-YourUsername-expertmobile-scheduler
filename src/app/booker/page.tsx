import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { CalendarDays, Clock, PlusCircle, Users } from "lucide-react";

export const metadata = { title: "Booker Dashboard — Expert Mobile" };

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "danger" | "muted" | "purple"> = {
  pending: "muted", confirmed: "default", on_the_way: "purple",
  in_progress: "warning", completed: "success", cancelled: "danger", no_show: "muted",
};

export default async function BookerDashboardPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const myFilter = { bookerId: session.userId };

  const [todayCount, pendingCount, monthCount, customerCount, recentBookings] =
    await Promise.all([
      prisma.booking.count({ where: { ...myFilter, scheduledStart: { gte: todayStart, lt: todayEnd } } }),
      prisma.booking.count({ where: { ...myFilter, status: "pending" } }),
      prisma.booking.count({ where: { ...myFilter, scheduledStart: { gte: monthStart } } }),
      prisma.customer.count(),
      prisma.booking.findMany({
        where: myFilter,
        orderBy: { scheduledStart: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          installer: { select: { name: true } },
        },
      }),
    ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <AnnouncementBanner audience="BOOKERS" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/booker/new">
          <Button><PlusCircle size={16} className="mr-2" />New Booking</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: CalendarDays, label: "My Jobs Today",  value: todayCount,   color: "primary" },
          { icon: Clock,        label: "Pending",        value: pendingCount, color: "warning" },
          { icon: CalendarDays, label: "This Month",     value: monthCount,   color: "success" },
          { icon: Users,        label: "Customers",      value: customerCount,color: "muted" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[var(--color-border)] p-5 flex items-center gap-4">
            <div className={`rounded-lg p-3 ${
              color === "primary" ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10" :
              color === "warning" ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10" :
              color === "success" ? "text-green-600 bg-green-100" :
              "text-[var(--color-text-muted)] bg-gray-100"
            }`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-[var(--color-border)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-sm">Recent Bookings</h2>
          <Link href="/booker/schedule" className="text-xs text-[var(--color-primary)] hover:underline">
            View all →
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[var(--color-text-muted)]">
            No bookings yet.{" "}
            <Link href="/booker/new" className="text-[var(--color-primary)] hover:underline">
              Create your first booking.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentBookings.map((b) => (
              <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{b.customer.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(b.scheduledStart).toLocaleDateString("en-CA", {
                      month: "short", day: "numeric",
                    })}
                    {" · "}
                    {formatTime(b.scheduledStart, b.timezone)}
                    {" · "}
                    {b.installer.name}
                  </p>
                </div>
                <Badge variant={STATUS_BADGE[b.status] ?? "muted"}>
                  {b.status.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
