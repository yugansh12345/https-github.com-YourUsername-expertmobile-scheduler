"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import {
  sendBookingCreatedEmail,
  sendBookingAssignedEmail,
  sendBookingCancelledEmail,
} from "@/lib/email";

// ─── Create Booking ───────────────────────────────────────────────────────────

export type CreateBookingResult =
  | { success: true; bookingId: string }
  | { success: false; error: string };

export async function createBookingAction(
  customerId: string,
  installerId: string,
  scheduledStart: string,
  scheduledEnd: string,
  serviceIds: string[],
  vehicleId: string | null,
  notes: string,
  address: string,
  timezone: string
): Promise<CreateBookingResult> {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "BOOKER"].includes(session.role)) {
    return { success: false, error: "Unauthorized" };
  }

  if (!customerId || !installerId || !scheduledStart || !scheduledEnd) {
    return { success: false, error: "Missing required fields" };
  }
  if (serviceIds.length === 0) {
    return { success: false, error: "Select at least one service" };
  }

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  if (start >= end) return { success: false, error: "End time must be after start time" };

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, basePrice: true },
  });
  if (services.length !== serviceIds.length) {
    return { success: false, error: "One or more selected services are unavailable" };
  }

  const totalPrice = services.reduce((sum, s) => sum + parseFloat(s.basePrice.toString()), 0);

  const booking = await prisma.booking.create({
    data: {
      customerId,
      installerId,
      bookerId: session.userId,
      vehicleId: vehicleId || null,
      scheduledStart: start,
      scheduledEnd: end,
      status: "pending",
      notes: notes || null,
      address: address || null,
      totalPrice,
      timezone: timezone || "America/Edmonton",
      services: { create: services.map((s) => ({ serviceId: s.id })) },
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "BOOKING_CREATED",
    entityType: "Booking",
    entityId: booking.id,
  });

  // Fire-and-forget emails
  const [customer, installer, serviceNames] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, email: true } }),
    prisma.user.findUnique({ where: { id: installerId }, select: { name: true, email: true, phone: true } }),
    prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { name: true } }),
  ]);
  const svcNames = serviceNames.map((s) => s.name);
  void sendBookingCreatedEmail({
    customerEmail: customer?.email ?? null,
    customerName: customer?.name ?? "Customer",
    installerName: installer?.name ?? "Installer",
    serviceNames: svcNames,
    scheduledStart: start,
    address: address || null,
    timezone: timezone || "America/Edmonton",
  });
  void sendBookingAssignedEmail({
    installerEmail: installer?.email ?? null,
    installerName: installer?.name ?? "Installer",
    customerName: customer?.name ?? "Customer",
    customerPhone: installer?.phone ?? null,
    serviceNames: svcNames,
    scheduledStart: start,
    address: address || null,
    timezone: timezone || "America/Edmonton",
  });

  revalidatePath("/booker");
  revalidatePath("/booker/schedule");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/installer");
  return { success: true, bookingId: booking.id };
}

// ─── Update Status ────────────────────────────────────────────────────────────

export type BookingActionResult = { success: true } | { success: false; error: string };

export async function updateBookingStatusAction(
  bookingId: string,
  status: string
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session?.userId) return { success: false, error: "Unauthorized" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.booking.update({ where: { id: bookingId }, data: { status: status as any } });

  await writeAuditLog({
    userId: session.userId,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: bookingId,
    metadata: { status },
  });

  revalidatePath("/booker/schedule");
  revalidatePath("/admin/schedule");
  revalidatePath("/installer");
  return { success: true };
}

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelBookingAction(bookingId: string): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session?.userId) return { success: false, error: "Unauthorized" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { bookerId: true, status: true },
  });

  if (!booking) return { success: false, error: "Booking not found" };
  if (booking.status === "completed") return { success: false, error: "Cannot cancel a completed booking" };
  if (session.role !== "ADMIN" && booking.bookerId !== session.userId) {
    return { success: false, error: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "cancelled" as any } });

  await writeAuditLog({
    userId: session.userId,
    action: "BOOKING_CANCELLED",
    entityType: "Booking",
    entityId: bookingId,
  });

  // Fire-and-forget cancellation email to installer
  const full = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      scheduledStart: true, timezone: true,
      customer: { select: { name: true } },
      installer: { select: { name: true, email: true } },
    },
  });
  if (full) {
    void sendBookingCancelledEmail({
      recipientEmail: full.installer.email,
      recipientName: full.installer.name,
      customerName: full.customer.name,
      scheduledStart: full.scheduledStart,
      timezone: full.timezone,
    });
  }

  revalidatePath("/booker/schedule");
  revalidatePath("/admin/schedule");
  revalidatePath("/installer");
  return { success: true };
}
