import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import InstallerBottomNav from "@/components/layout/InstallerBottomNav";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import { installerNavItems } from "@/components/layout/nav-items";

export default async function InstallerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "INSTALLER"].includes(session.role)) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });

  const userName = user?.name ?? user?.username ?? "Installer";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-light)]">
      {/* Desktop sidebar (hidden on mobile, installer mostly uses mobile) */}
      <div className="relative hidden md:flex">
        <Sidebar items={installerNavItems} userName={userName} userRole="INSTALLER" />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <TopBar items={installerNavItems} title="My Jobs" userName={userName} userRole="INSTALLER" />

        {/* Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 md:p-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <InstallerBottomNav items={installerNavItems} />
      </div>
    </div>
  );
}
