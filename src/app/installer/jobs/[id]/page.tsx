import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import JobDetail from "./JobDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Job ${id.slice(-6).toUpperCase()} — Installer` };
}

export default async function JobDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, phone: true, address: true } },
      vehicle: {
        select: { vehicleType: true, year: true, make: true, model: true, color: true },
      },
      services: { include: { service: { select: { name: true } } } },
      photos: { orderBy: { uploadedAt: "asc" } },
      signature: true,
    },
  });

  if (!booking) notFound();

  // Installers can only view their own jobs; admins see all
  if (session.role === "INSTALLER" && booking.installerId !== session.userId) {
    redirect("/installer");
  }

  return (
    <div>
      <Link
        href="/installer"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4"
      >
        <ChevronLeft size={16} /> Back to My Jobs
      </Link>

      <JobDetail
        booking={{
          ...booking,
          vehicle: booking.vehicle
            ? {
                ...booking.vehicle,
                vehicleType: booking.vehicle.vehicleType as string,
              }
            : null,
          photos: booking.photos.map((p) => ({
            ...p,
            type: p.type as "BEFORE" | "AFTER" | "ISSUE" | "EQUIPMENT_LABEL",
          })),
          signature: booking.signature
            ? {
                signatureUrl: booking.signature.signatureUrl,
                signerName: booking.signature.signerName,
                signedAt: booking.signature.signedAt,
              }
            : null,
        }}
      />
    </div>
  );
}
