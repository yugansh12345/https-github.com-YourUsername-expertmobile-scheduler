import { prisma } from "@/lib/prisma";
import AnnouncementManagement, { type AnnouncementRow } from "./AnnouncementManagement";

export const metadata = { title: "Announcements — Admin" };

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, username: true } } },
  });

  const rows: AnnouncementRow[] = announcements.map((a) => ({
    id: a.id,
    message: a.message,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() ?? null,
    createdBy: a.createdBy.name ?? a.createdBy.username,
  }));

  return <AnnouncementManagement initialAnnouncements={rows} />;
}
