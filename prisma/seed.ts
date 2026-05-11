/**
 * Seed script — run with:
 *   node --experimental-strip-types prisma/seed.ts
 *
 * Admin login: username=admin  password=Admin@Expert2024
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Load .env manually when running outside Next.js
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* ignore */ }
}
loadEnv();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const BCRYPT_COST = 12;
async function h(pw: string) { return bcrypt.hash(pw, BCRYPT_COST); }

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { name: "Two-Way Radio Installation", category: "two_way_radio", durationMinutes: 60, basePrice: 150, requiredSkills: ["radio"], sortOrder: 1 },
  { name: "Two-Way Radio Programming", category: "two_way_radio", durationMinutes: 30, basePrice: 75, requiredSkills: ["radio"], sortOrder: 2 },
  { name: "PTT/PoC Radio Setup", category: "poc_radio", durationMinutes: 45, basePrice: 100, requiredSkills: ["poc"], sortOrder: 3 },
  { name: "Cell Booster Installation", category: "cell_booster", durationMinutes: 120, basePrice: 300, requiredSkills: ["booster"], sortOrder: 4 },
  { name: "Cell Booster — Commercial Building", category: "cell_booster", durationMinutes: 180, basePrice: 500, requiredSkills: ["booster"], sortOrder: 5 },
  { name: "ELD Installation", category: "fleet_tracking_eld", durationMinutes: 90, basePrice: 200, requiredSkills: ["eld"], sortOrder: 6 },
  { name: "GPS Fleet Tracker Install", category: "fleet_tracking_eld", durationMinutes: 60, basePrice: 175, requiredSkills: ["eld"], sortOrder: 7 },
  { name: "Satellite Phone Activation", category: "satellite", durationMinutes: 30, basePrice: 125, requiredSkills: ["satellite"], sortOrder: 8 },
  { name: "Satellite Communicator Setup", category: "satellite", durationMinutes: 45, basePrice: 150, requiredSkills: ["satellite"], sortOrder: 9 },
  { name: "Antenna Mount & Coax", category: "two_way_radio", durationMinutes: 60, basePrice: 120, requiredSkills: ["antenna"], sortOrder: 10 },
] as const;

const CUSTOMER_NAMES = [
  "Apex Trucking Ltd", "Barrett Oil Services", "Canyon Drilling Inc", "Dawson Logistics",
  "Eagle Eye Security", "Frontier Hauling", "Glacier Transport", "Horizon Fleet",
  "Iron Horse Contracting", "Jasper Ridge Farms", "Kingsway Rentals", "Larkin Construction",
  "Mackenzie River Freight", "Northern Lights Oilfield", "Oilsands Express",
  "Pembina Valley Farms", "Quicksilver Courier", "Ridgeline Services",
  "Summit Crane & Rigging", "Thunder Basin Transport", "Ultramar Fleet",
  "Valley Wide Dispatch", "Westlock Ag Services", "Xplore Wireless",
  "Yellowhead Transport", "Zephyr Wind Solutions",
  "Tom Hargreaves", "Sandy Kowalski", "Mike Dutchak", "Linda Pellerin",
  "Gary Strickland", "Dana Fehr", "Brent Zacharias", "Carol Tremblay",
  "Raj Patel", "Amy Lethbridge",
];

const CITIES = ["Grande Prairie", "Clairmont", "Sexsmith", "Spirit River", "Fairview", "Peace River", "High Prairie"];
const PROVINCES = ["AB"];
const STREETS = ["100 Ave", "100 St", "Bear Creek Rd", "Highway 2", "Township Rd 714", "Range Rd 53", "Airport Rd", "Industrial Ave"];

const VEHICLE_TYPES = ["heavy_truck", "light_truck", "pickup", "fleet_vehicle", "suv"] as const;
const MAKES = ["Ford", "GM", "Kenworth", "Peterbilt", "Ram", "Toyota", "Chevrolet", "International"];
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

const INSTALLER_NAMES = [
  { first: "Cole", last: "MacPherson" },
  { first: "Brianna", last: "Tanner" },
  { first: "Derek", last: "Foisey" },
  { first: "Janet", last: "Kulak" },
  { first: "Nolan", last: "Reimer" },
  { first: "Tasha", last: "Wolfe" },
];

const BOOKER_NAMES = [
  { first: "Alicia", last: "Bergman" },
  { first: "Kevin", last: "Poulin" },
  { first: "Steph", last: "Olson" },
  { first: "Marcus", last: "Dube" },
  { first: "Rachel", last: "Hicks" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function toUsername(first: string, last: string) {
  return (first.toLowerCase() + last.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admins ──────────────────────────────────────────────────────────────────
  const adminPw = await h("Admin@Expert2024");
  const admin1 = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@expertmobile.ca",
      hashedPassword: adminPw,
      role: "ADMIN",
      name: "System Admin",
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
      twoFactorRequired: false,
    },
  });

  await prisma.user.upsert({
    where: { username: "jadmin" },
    update: {},
    create: {
      username: "jadmin",
      email: "jadmin@expertmobile.ca",
      hashedPassword: await h("Admin@Expert2024"),
      role: "ADMIN",
      name: "Jane Admin",
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
      twoFactorRequired: false,
    },
  });
  console.log("  ✓ Admins");

  // ── Bookers ─────────────────────────────────────────────────────────────────
  const bookerIds: string[] = [];
  for (const { first, last } of BOOKER_NAMES) {
    const username = toUsername(first, last);
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        email: `${username}@expertmobile.ca`,
        hashedPassword: await h("Booker@Expert2024"),
        role: "BOOKER",
        name: `${first} ${last}`,
        isActive: true,
        isLocked: false,
        mustChangePassword: false,
        createdById: admin1.id,
      },
    });
    await prisma.booker.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, location: "Grande Prairie, AB" },
    });
    bookerIds.push(user.id);
  }
  console.log("  ✓ Bookers");

  // ── Installers ───────────────────────────────────────────────────────────────
  const installerIds: string[] = [];
  const skillSets = [
    ["radio", "antenna"],
    ["booster", "antenna"],
    ["eld", "radio"],
    ["satellite", "poc"],
    ["radio", "booster", "antenna"],
    ["eld", "satellite", "poc"],
  ] as const;

  for (let i = 0; i < INSTALLER_NAMES.length; i++) {
    const { first, last } = INSTALLER_NAMES[i];
    const username = toUsername(first, last);
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        email: `${username}@expertmobile.ca`,
        hashedPassword: await h("Install@Expert2024"),
        role: "INSTALLER",
        name: `${first} ${last}`,
        phone: `780-555-0${100 + i}`,
        isActive: true,
        isLocked: false,
        mustChangePassword: false,
        createdById: admin1.id,
      },
    });
    await prisma.installer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skills: [...skillSets[i]] as unknown as any[],
        timezone: "America/Edmonton",
        bio: `Experienced installer specializing in ${skillSets[i].join(", ")}.`,
      },
    });
    installerIds.push(user.id);
  }
  console.log("  ✓ Installers");

  // ── Services ─────────────────────────────────────────────────────────────────
  const serviceIds: string[] = [];
  for (const s of SERVICES) {
    let svc = await prisma.service.findFirst({ where: { name: s.name } });
    if (!svc) {
      svc = await prisma.service.create({
        data: {
          name: s.name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: s.category as any,
          durationMinutes: s.durationMinutes,
          basePrice: s.basePrice,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          requiredSkills: [...s.requiredSkills] as unknown as any[],
          isActive: true,
          sortOrder: s.sortOrder,
        },
      });
    }
    serviceIds.push(svc.id);
  }
  console.log("  ✓ Services");

  // ── Customers + Vehicles ──────────────────────────────────────────────────────
  const customerIds: string[] = [];
  const vehicleMap: Record<string, string[]> = {};

  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const name = CUSTOMER_NAMES[i];
    const isCommercial = i < 26;
    const city = pick(CITIES);
    const email = `customer${i}@example.com`;
    let customer = await prisma.customer.findFirst({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone: `780-555-${1000 + i}`,
          address: `${rand(100, 9999)} ${pick(STREETS)}`,
          city,
          province: "AB",
          postalCode: `T8V ${rand(0, 9)}${String.fromCharCode(65 + rand(0, 25))}${rand(0, 9)}`,
          customerType: isCommercial ? "commercial" : "residential",
          accountNumber: `EM-${1000 + i}`,
        },
      });
    }
    customerIds.push(customer.id);

    // 2 vehicles per customer
    const vids: string[] = [];
    for (let v = 0; v < 2; v++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vehicleType: pick(VEHICLE_TYPES) as any,
          year: pick(YEARS),
          make: pick(MAKES),
          model: "Series " + rand(100, 999),
          fleetUnitNumber: isCommercial ? `UNIT-${rand(1, 99)}` : null,
        },
      });
      vids.push(vehicle.id);
    }
    vehicleMap[customer.id] = vids;
  }
  console.log("  ✓ Customers + Vehicles");

  // ── Bookings ──────────────────────────────────────────────────────────────────
  const STATUSES = ["pending", "confirmed", "on_the_way", "in_progress", "completed", "cancelled", "no_show"] as const;
  const STATUS_WEIGHTS = [5, 10, 3, 5, 50, 15, 5];
  const cumulativeWeights: number[] = [];
  let cum = 0;
  for (const w of STATUS_WEIGHTS) { cum += w; cumulativeWeights.push(cum); }
  function pickStatus() {
    const r = Math.random() * cum;
    for (let i = 0; i < cumulativeWeights.length; i++) {
      if (r < cumulativeWeights[i]) return STATUSES[i];
    }
    return STATUSES[4];
  }

  const now = new Date();
  const base = new Date(now);
  base.setDate(now.getDate() - 30);

  for (let i = 0; i < 150; i++) {
    const offsetDays = rand(-30, 14);
    const startHour = rand(7, 17);
    const startMinute = rand(0, 1) * 30;
    const start = addDays(base, offsetDays + 30);
    start.setHours(startHour, startMinute, 0, 0);

    const durationMins = pick([60, 90, 120, 30, 45]);
    const end = new Date(start.getTime() + durationMins * 60000);

    const customerId = pick(customerIds);
    const installerId = pick(installerIds);
    const bookerId = pick(bookerIds);
    const svcId = pick(serviceIds);
    const vehicleId = vehicleMap[customerId] ? pick(vehicleMap[customerId]) : null;
    const status = offsetDays < -2 ? (Math.random() < 0.8 ? "completed" : (Math.random() < 0.5 ? "cancelled" : "no_show")) : pickStatus();

    await prisma.booking.create({
      data: {
        customerId,
        installerId,
        bookerId,
        vehicleId,
        scheduledStart: start,
        scheduledEnd: end,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
        timezone: "America/Edmonton",
        address: `${rand(100, 9999)} ${pick(STREETS)}, ${pick(CITIES)}, AB`,
        totalPrice: rand(75, 500),
        services: { create: [{ serviceId: svcId }] },
      },
    });
  }
  console.log("  ✓ Bookings (150)");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login — username: admin  |  password: Admin@Expert2024");
  console.log("   Booker login — username: aliciabergman  |  password: Booker@Expert2024");
  console.log("   Installer login — username: colemacpherson  |  password: Install@Expert2024");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
