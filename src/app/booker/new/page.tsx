import { prisma } from "@/lib/prisma";
import NewBookingWizard, { type ServiceOption, type InstallerOption } from "./NewBookingWizard";

export const metadata = { title: "New Booking — Booker" };

export default async function NewBookingPage() {
  const [services, installers] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true, durationMinutes: true, basePrice: true },
    }),
    prisma.user.findMany({
      where: { role: "INSTALLER", isActive: true, isLocked: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serviceOptions: ServiceOption[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    durationMinutes: s.durationMinutes,
    basePrice: s.basePrice.toString(),
  }));

  const installerOptions: InstallerOption[] = installers;

  return <NewBookingWizard services={serviceOptions} installers={installerOptions} />;
}
