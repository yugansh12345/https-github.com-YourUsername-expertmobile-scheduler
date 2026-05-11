import { prisma } from "@/lib/prisma";
import ServiceManagement, { type ServiceRow } from "./ServiceManagement";

export const metadata = { title: "Services — Admin" };

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const rows: ServiceRow[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    durationMinutes: s.durationMinutes,
    basePrice: s.basePrice.toString(),
    description: s.description,
    requiredSkills: s.requiredSkills as string[],
    isActive: s.isActive,
    sortOrder: s.sortOrder,
  }));

  return <ServiceManagement initialServices={rows} />;
}
