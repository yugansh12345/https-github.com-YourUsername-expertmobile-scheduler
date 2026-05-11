import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile — Installer" };

export default async function InstallerProfilePage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      phone: true,
      installer: {
        select: { bio: true, timezone: true, skills: true },
      },
    },
  });

  if (!user) redirect("/login");

  const timeOffRequests = await prisma.timeOff.findMany({
    where: { installerId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
      status: true,
    },
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Profile</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{user.name}</p>
      </div>
      <ProfileForm
        name={user.name}
        phone={user.phone ?? ""}
        bio={user.installer?.bio ?? ""}
        timezone={user.installer?.timezone ?? "America/Edmonton"}
        skills={(user.installer?.skills ?? []) as string[]}
        timeOffRequests={timeOffRequests.map((r) => ({
          ...r,
          status: r.status as string,
        }))}
      />
    </div>
  );
}
