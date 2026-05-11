import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { bookerNavItems } from "@/components/layout/nav-items";

export default async function BookerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "BOOKER"].includes(session.role)) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });

  const userName = user?.name ?? user?.username ?? "Booker";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-light)]">
      <div className="relative">
        <Sidebar items={bookerNavItems} userName={userName} userRole="BOOKER" />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar items={bookerNavItems} title="Bookings" userName={userName} userRole="BOOKER" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
