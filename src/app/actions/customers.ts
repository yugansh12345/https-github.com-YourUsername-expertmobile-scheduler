"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().default("AB"),
  postalCode: z.string().optional(),
  customerType: z.enum(["residential", "commercial", "industrial", "fleet"]).default("residential"),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
});

function nullEmpty(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

function parseCustomerForm(formData: FormData) {
  return CustomerSchema.safeParse({
    name: formData.get("name"),
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    province: (formData.get("province") as string) || "AB",
    postalCode: (formData.get("postalCode") as string) || undefined,
    customerType: (formData.get("customerType") as string) || "residential",
    accountNumber: (formData.get("accountNumber") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });
}

// ─── Create Customer ─────────────────────────────────────────────────────────

export type CustomerResult =
  | { success: true; customerId: string }
  | { success: false; error: string };

export async function createCustomerAction(formData: FormData): Promise<CustomerResult> {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "BOOKER"].includes(session.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const customer = await prisma.customer.create({
    data: {
      name: d.name,
      email: nullEmpty(d.email),
      phone: nullEmpty(d.phone),
      address: nullEmpty(d.address),
      city: nullEmpty(d.city),
      province: d.province,
      postalCode: nullEmpty(d.postalCode),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customerType: d.customerType as any,
      accountNumber: nullEmpty(d.accountNumber),
      notes: nullEmpty(d.notes),
    },
  });

  revalidatePath("/booker/customers");
  return { success: true, customerId: customer.id };
}

// ─── Update Customer ─────────────────────────────────────────────────────────

export type UpdateCustomerResult = { success: true } | { success: false; error: string };

export async function updateCustomerAction(formData: FormData): Promise<UpdateCustomerResult> {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "BOOKER"].includes(session.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const customerId = formData.get("customerId") as string;
  if (!customerId) return { success: false, error: "Missing customer ID" };

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: d.name,
      email: nullEmpty(d.email),
      phone: nullEmpty(d.phone),
      address: nullEmpty(d.address),
      city: nullEmpty(d.city),
      province: d.province,
      postalCode: nullEmpty(d.postalCode),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customerType: d.customerType as any,
      accountNumber: nullEmpty(d.accountNumber),
      notes: nullEmpty(d.notes),
    },
  });

  revalidatePath("/booker/customers");
  return { success: true };
}

// ─── Search Customers ─────────────────────────────────────────────────────────

export type CustomerSearchItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  customerType: string;
};

export async function searchCustomersAction(query: string): Promise<CustomerSearchItem[]> {
  const session = await getSession();
  if (!session?.userId) return [];

  const q = query.trim();

  if (!q) {
    return prisma.customer.findMany({
      take: 10,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, city: true, customerType: true },
    });
  }

  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { accountNumber: { contains: q } },
      ],
    },
    take: 10,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true, city: true, customerType: true },
  });
}

// ─── Customer Vehicles ────────────────────────────────────────────────────────

export type VehicleItem = {
  id: string;
  vehicleType: string;
  year: number | null;
  make: string | null;
  model: string | null;
  color: string | null;
};

export async function getCustomerVehiclesAction(customerId: string): Promise<VehicleItem[]> {
  const session = await getSession();
  if (!session?.userId) return [];

  return prisma.vehicle.findMany({
    where: { customerId },
    select: { id: true, vehicleType: true, year: true, make: true, model: true, color: true },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Create Vehicle ───────────────────────────────────────────────────────────

export type CreateVehicleResult =
  | { success: true; vehicleId: string }
  | { success: false; error: string };

export async function createVehicleAction(
  customerId: string,
  vehicleType: string,
  year: number | null,
  make: string | null,
  model: string | null,
  color: string | null
): Promise<CreateVehicleResult> {
  const session = await getSession();
  if (!session?.userId || !["ADMIN", "BOOKER"].includes(session.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      customerId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vehicleType: vehicleType as any,
      year,
      make,
      model,
      color,
    },
  });

  return { success: true, vehicleId: vehicle.id };
}
