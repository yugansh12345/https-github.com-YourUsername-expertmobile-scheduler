import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// NHTSA vehicle type -> vPIC vehicleType query value mapping
const NHTSA_TYPE_MAP: Record<string, string> = {
  heavy_truck: "truck",
  light_truck: "truck",
  pickup: "truck",
  sedan: "passenger car",
  suv: "multipurpose passenger vehicle (mpv)",
  rv: "multipurpose passenger vehicle (mpv)",
  motorhome: "bus",
  fifth_wheel: "trailer",
  boat: "trailer",
  heavy_equipment: "incomplete vehicle",
  fleet_vehicle: "truck",
  atv_side_by_side: "off road vehicle",
  other: "passenger car",
};

// Cache TTL: 7 days
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const vehicleType = req.nextUrl.searchParams.get("type") ?? "other";

  // Check cache freshness
  const cached = await prisma.vehicleMakeCache.findMany({
    where: { vehicleType },
    orderBy: { makeName: "asc" },
  });

  if (cached.length > 0) {
    const age = Date.now() - cached[0].fetchedAt.getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.map((m) => ({ id: m.makeId, name: m.makeName })));
    }
  }

  // Fetch from NHTSA
  try {
    const nhtsaType = NHTSA_TYPE_MAP[vehicleType] ?? "passenger car";
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${encodeURIComponent(nhtsaType)}?format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const data = await res.json();
    const makes: { MakeId: number; MakeName: string }[] = data.Results ?? [];

    if (makes.length > 0) {
      // Upsert into cache
      await prisma.$transaction(
        makes.map((m) =>
          prisma.vehicleMakeCache.upsert({
            where: { vehicleType_makeId: { vehicleType, makeId: m.MakeId } },
            create: { vehicleType, makeId: m.MakeId, makeName: m.MakeName, fetchedAt: new Date() },
            update: { makeName: m.MakeName, fetchedAt: new Date() },
          })
        )
      );
      return NextResponse.json(makes.map((m) => ({ id: m.MakeId, name: m.MakeName })));
    }
  } catch {
    // Fall through to return stale cache if available
  }

  return NextResponse.json(cached.map((m) => ({ id: m.makeId, name: m.makeName })));
}
