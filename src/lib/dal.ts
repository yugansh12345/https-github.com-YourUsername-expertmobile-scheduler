import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession, type UserRole } from "@/lib/session";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  return session;
});

export async function requireRole(...roles: UserRole[]) {
  const session = await verifySession();
  if (!roles.includes(session.role)) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireBookerOrAdmin() {
  return requireRole("ADMIN", "BOOKER");
}

export async function requireInstallerOrAdmin() {
  return requireRole("ADMIN", "INSTALLER");
}
