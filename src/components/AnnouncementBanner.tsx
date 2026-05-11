import { prisma } from "@/lib/prisma";
import { Megaphone } from "lucide-react";

interface Props {
  audience: "BOOKERS" | "INSTALLERS";
}

export default async function AnnouncementBanner({ audience }: Props) {
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      audience: { in: ["ALL", audience] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, message: true, createdAt: true },
  });

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-4 py-3"
        >
          <Megaphone size={16} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text)]">{a.message}</p>
        </div>
      ))}
    </div>
  );
}
