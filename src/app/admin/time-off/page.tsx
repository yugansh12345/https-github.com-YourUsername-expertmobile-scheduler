import { prisma } from "@/lib/prisma";
import TimeOffManager from "./TimeOffManager";

export const metadata = { title: "Time Off — Admin" };

export default async function AdminTimeOffPage() {
  const [installers, records] = await Promise.all([
    prisma.user.findMany({
      where: { role: "INSTALLER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.timeOff.findMany({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      take: 60,
      include: {
        installer: { select: { name: true } },
      },
    }),
  ]);

  // Fetch reviewer names for records that have been reviewed
  const reviewerIds = [...new Set(records.map(r => r.reviewedById).filter(Boolean))] as string[];
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true },
      })
    : [];
  const reviewerMap = Object.fromEntries(reviewers.map(u => [u.id, u.name]));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Time Off Management</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Review installer requests and book days off directly.
        </p>
      </div>

      <TimeOffManager
        installers={installers}
        records={records.map(r => ({
          id: r.id,
          installerId: r.installerId,
          installerName: r.installer.name,
          startDate: r.startDate,
          endDate: r.endDate,
          reason: r.reason,
          status: r.status,
          reviewedByName: r.reviewedById ? (reviewerMap[r.reviewedById] ?? null) : null,
        }))}
      />
    </div>
  );
}
