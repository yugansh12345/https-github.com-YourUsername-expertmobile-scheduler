"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/passwords";
import { generateTempPassword } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";

type Role = "ADMIN" | "BOOKER" | "INSTALLER";

// ─── Create User ─────────────────────────────────────────────────────────────

export type CreateUserResult =
  | { success: true; tempPassword: string }
  | { success: false; error: string };

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "BOOKER", "INSTALLER"]),
  phone: z.string().optional(),
  twoFactorRequired: z.boolean().default(false),
});

export async function createUserAction(formData: FormData): Promise<CreateUserResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    username: (formData.get("username") as string)?.toLowerCase().trim(),
    email: (formData.get("email") as string)?.toLowerCase().trim(),
    role: formData.get("role"),
    phone: (formData.get("phone") as string) || undefined,
    twoFactorRequired: formData.get("twoFactorRequired") === "true",
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { name, username, email, role, phone, twoFactorRequired } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    return {
      success: false,
      error: existing.email === email ? "Email already in use" : "Username already taken",
    };
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      name, username, email,
      role: role as Role,
      phone: phone ?? null,
      hashedPassword,
      mustChangePassword: true,
      twoFactorRequired,
      createdById: session.userId,
    },
  });

  if (role === "INSTALLER") {
    await prisma.installer.create({ data: { userId: user.id } });
  } else if (role === "BOOKER") {
    await prisma.booker.create({ data: { userId: user.id } });
  }

  await writeAuditLog({
    userId: session.userId,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { role, username },
  });

  revalidatePath("/admin/users");
  return { success: true, tempPassword };
}

// ─── Update User ─────────────────────────────────────────────────────────────

export type UpdateUserResult = { success: true } | { success: false; error: string };

export async function updateUserAction(formData: FormData): Promise<UpdateUserResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const userId = formData.get("userId") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = (formData.get("phone") as string) || null;
  const isActive = formData.get("isActive") === "true";
  const twoFactorRequired = formData.get("twoFactorRequired") === "true";

  if (!userId || !name || !email) return { success: false, error: "Missing required fields" };

  const conflict = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
    select: { id: true },
  });
  if (conflict) return { success: false, error: "Email already in use by another account" };

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone, isActive, twoFactorRequired },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Services ────────────────────────────────────────────────────────────────

export type ServiceResult = { success: true } | { success: false; error: string };

const ServiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "two_way_radio", "poc_radio", "cell_booster", "fleet_tracking_eld", "satellite",
  ]),
  durationMinutes: z.coerce.number().int().min(15, "Minimum 15 minutes"),
  basePrice: z.coerce.number().min(0, "Price must be ≥ 0"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createServiceAction(formData: FormData): Promise<ServiceResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const parsed = ServiceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    basePrice: formData.get("basePrice"),
    description: (formData.get("description") as string) || undefined,
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const skills = formData.getAll("requiredSkills") as string[];

  const service = await prisma.service.create({
    data: {
      ...parsed.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requiredSkills: skills as any[],
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "SERVICE_CREATED",
    entityType: "Service",
    entityId: service.id,
  });

  revalidatePath("/admin/services");
  return { success: true };
}

export async function updateServiceAction(formData: FormData): Promise<ServiceResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const serviceId = formData.get("serviceId") as string;
  if (!serviceId) return { success: false, error: "Missing service ID" };

  const parsed = ServiceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    basePrice: formData.get("basePrice"),
    description: (formData.get("description") as string) || undefined,
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const skills = formData.getAll("requiredSkills") as string[];

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      ...parsed.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requiredSkills: skills as any[],
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "SERVICE_UPDATED",
    entityType: "Service",
    entityId: serviceId,
  });

  revalidatePath("/admin/services");
  return { success: true };
}

export async function toggleServiceActiveAction(
  serviceId: string,
  isActive: boolean
): Promise<ServiceResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  await prisma.service.update({ where: { id: serviceId }, data: { isActive } });
  revalidatePath("/admin/services");
  return { success: true };
}

// ─── Announcements ────────────────────────────────────────────────────────────

export type AnnouncementResult = { success: true } | { success: false; error: string };

export async function createAnnouncementAction(formData: FormData): Promise<AnnouncementResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const message = (formData.get("message") as string)?.trim();
  const audience = formData.get("audience") as string;
  const expiresAtRaw = formData.get("expiresAt") as string;

  if (!message) return { success: false, error: "Message is required" };
  if (!["ALL", "INSTALLERS", "BOOKERS"].includes(audience)) return { success: false, error: "Invalid audience" };

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  const ann = await prisma.announcement.create({
    data: {
      message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audience: audience as any,
      createdById: session.userId,
      expiresAt,
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "ANNOUNCEMENT_CREATED",
    entityType: "Announcement",
    entityId: ann.id,
  });

  revalidatePath("/admin/announcements");
  return { success: true };
}

export async function deleteAnnouncementAction(id: string): Promise<AnnouncementResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/admin/announcements");
  return { success: true };
}

// ─── Time Off Management ──────────────────────────────────────────────────────

export type TimeOffResult = { success: true } | { success: false; error: string };

export async function approveTimeOffAction(id: string): Promise<TimeOffResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const record = await prisma.timeOff.findUnique({ where: { id }, select: { installerId: true } });
  if (!record) return { success: false, error: "Record not found" };

  await prisma.timeOff.update({
    where: { id },
    data: { status: "approved", reviewedById: session.userId },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "TIME_OFF_APPROVED",
    entityType: "TimeOff",
    entityId: id,
  });

  revalidatePath("/admin/time-off");
  revalidatePath("/installer/schedule");
  return { success: true };
}

export async function rejectTimeOffAction(id: string): Promise<TimeOffResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const record = await prisma.timeOff.findUnique({ where: { id }, select: { installerId: true } });
  if (!record) return { success: false, error: "Record not found" };

  await prisma.timeOff.update({
    where: { id },
    data: { status: "rejected", reviewedById: session.userId },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "TIME_OFF_REJECTED",
    entityType: "TimeOff",
    entityId: id,
  });

  revalidatePath("/admin/time-off");
  return { success: true };
}

export async function adminCreateTimeOffAction(
  installerId: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<TimeOffResult> {
  const session = await getSession();
  if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  if (!installerId || !startDate || !endDate) return { success: false, error: "Missing required fields" };
  if (endDate < startDate) return { success: false, error: "End date must be on or after start date" };

  const installer = await prisma.user.findFirst({
    where: { id: installerId, role: "INSTALLER" },
    select: { id: true },
  });
  if (!installer) return { success: false, error: "Installer not found" };

  const record = await prisma.timeOff.create({
    data: {
      installerId,
      startDate: new Date(startDate + "T00:00:00"),
      endDate: new Date(endDate + "T23:59:59"),
      reason: reason.trim() || null,
      status: "approved",
      reviewedById: session.userId,
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "TIME_OFF_REQUESTED",
    entityType: "TimeOff",
    entityId: record.id,
    metadata: { installerId, startDate, endDate, createdBy: "admin", autoApproved: true },
  });

  revalidatePath("/admin/time-off");
  revalidatePath("/installer/schedule");
  return { success: true };
}
