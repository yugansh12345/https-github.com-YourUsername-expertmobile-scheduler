import { prisma } from "@/lib/prisma";
import CustomerManagement, { type CustomerRow } from "./CustomerManagement";

export const metadata = { title: "Customers — Booker" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BookerCustomersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { accountNumber: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  });

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    province: c.province,
    postalCode: c.postalCode,
    customerType: c.customerType,
    accountNumber: c.accountNumber,
    notes: c.notes,
    bookingCount: c._count.bookings,
  }));

  return <CustomerManagement initialCustomers={rows} searchQuery={query} />;
}
