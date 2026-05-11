"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

// Valid status transitions for installers
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed"],
  confirmed: ["on_the_way"],
  on_the_way: ["in_progress"],
  in_progress: ["completed", "no_show"],
};

export async function updateJobStatusAction(
  bookingId: string,
  newStatus: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { installerId: true, status: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.installerId !== session.userId)
    return { ok: false, error: "Not your booking" };

  const allowed = ALLOWED_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(newStatus))
    return { ok: false, error: `Cannot transition from ${booking.status} to ${newStatus}` };

  await prisma.booking.update({
    where: { id: bookingId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { status: newStatus as any },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "BOOKING_STATUS_CHANGED",
    entityType: "Booking",
    entityId: bookingId,
    metadata: { from: booking.status, to: newStatus },
  });

  revalidatePath(`/installer/jobs/${bookingId}`);
  revalidatePath("/installer");
  revalidatePath("/installer/schedule");
  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function addPhotoAction(
  bookingId: string,
  dataUrl: string,
  type: "BEFORE" | "AFTER" | "ISSUE" | "EQUIPMENT_LABEL"
): Promise<{ ok: boolean; error?: string; photoId?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { installerId: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.installerId !== session.userId)
    return { ok: false, error: "Not your booking" };

  const photo = await prisma.bookingPhoto.create({
    data: {
      bookingId,
      url: dataUrl,
      type,
      uploadedById: session.userId,
    },
  });

  revalidatePath(`/installer/jobs/${bookingId}`);
  return { ok: true, photoId: photo.id };
}

export async function deletePhotoAction(
  photoId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  const photo = await prisma.bookingPhoto.findUnique({
    where: { id: photoId },
    select: { uploadedById: true, bookingId: true },
  });
  if (!photo) return { ok: false, error: "Photo not found" };
  if (photo.uploadedById !== session.userId)
    return { ok: false, error: "Not your photo" };

  await prisma.bookingPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/installer/jobs/${photo.bookingId}`);
  return { ok: true };
}

export async function saveSignatureAction(
  bookingId: string,
  dataUrl: string,
  signerName: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { installerId: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.installerId !== session.userId)
    return { ok: false, error: "Not your booking" };

  await prisma.bookingSignature.upsert({
    where: { bookingId },
    create: { bookingId, signatureUrl: dataUrl, signerName, signedAt: new Date() },
    update: { signatureUrl: dataUrl, signerName, signedAt: new Date() },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "BOOKING_UPDATED",
    entityType: "Booking",
    entityId: bookingId,
    metadata: { event: "signed", signerName },
  });

  revalidatePath(`/installer/jobs/${bookingId}`);
  return { ok: true };
}

export async function saveInternalNoteAction(
  bookingId: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { installerId: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.installerId !== session.userId)
    return { ok: false, error: "Not your booking" };

  await prisma.booking.update({
    where: { id: bookingId },
    data: { internalNotes: note },
  });

  revalidatePath(`/installer/jobs/${bookingId}`);
  return { ok: true };
}

export async function requestTimeOffAction(
  startDate: string,
  endDate: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  await prisma.timeOff.create({
    data: {
      installerId: session.userId,
      startDate: new Date(startDate + "T00:00:00"),
      endDate: new Date(endDate + "T23:59:59"),
      reason: reason.trim() || null,
      status: "pending",
    },
  });

  await writeAuditLog({
    userId: session.userId,
    action: "TIME_OFF_REQUESTED",
    entityType: "TimeOff",
    metadata: { startDate, endDate, reason },
  });

  revalidatePath("/installer/profile");
  return { ok: true };
}

export async function updateInstallerProfileAction(
  bio: string,
  phone: string,
  timezone: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: "Not authenticated" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { phone: phone.trim() || null },
    }),
    prisma.installer.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, bio: bio.trim() || null, timezone },
      update: { bio: bio.trim() || null, timezone },
    }),
  ]);

  revalidatePath("/installer/profile");
  return { ok: true };
}
