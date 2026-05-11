export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_DEACTIVATED"
  | "USER_ACTIVATED"
  | "USER_LOCKED"
  | "USER_UNLOCKED"
  | "USER_ROLE_CHANGED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REASSIGNED"
  | "BOOKING_STATUS_CHANGED"
  | "TIME_OFF_REQUESTED"
  | "TIME_OFF_APPROVED"
  | "TIME_OFF_REJECTED"
  | "ANNOUNCEMENT_CREATED"
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICE_DELETED";

export async function writeAuditLog({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  // Lazy import to avoid circular deps and keep this module importable before schema is generated
  const { prisma } = await import("@/lib/prisma");
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });
  } catch {
    console.error("[audit] Failed to write audit log", {
      userId,
      action,
      entityType,
      entityId,
    });
  }
}
