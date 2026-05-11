import { prisma } from "@/lib/prisma";
import UserManagement, { type UserRow } from "./UserManagement";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, username: true, email: true,
      role: true, isActive: true, isLocked: true,
      phone: true, twoFactorRequired: true, lastLoginAt: true,
    },
  });

  const rows: UserRow[] = users.map((u) => ({
    ...u,
    role: u.role as UserRow["role"],
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));

  return <UserManagement initialUsers={rows} />;
}
