import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { adminNavItems } from "@/components/layout/nav-items";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });

  const userName = user?.name ?? user?.username ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-light)]">
      {/* Desktop sidebar — relative so the collapse toggle button can be absolute within it */}
      <div className="relative">
        <Sidebar items={adminNavItems} userName={userName} userRole="ADMIN" />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <TopBar items={adminNavItems} title="Admin" userName={userName} userRole="ADMIN" />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
