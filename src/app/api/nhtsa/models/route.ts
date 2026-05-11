import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache TTL: 30 days (models change rarely)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const makeIdStr = req.nextUrl.searchParams.get("makeId");
  const yearStr = req.nextUrl.searchParams.get("year");

  if (!makeIdStr || !yearStr) {
    return NextResponse.json({ error: "makeId and year are required" }, { status: 400 });
  }

  const makeId = parseInt(makeIdStr, 10);
  const year = parseInt(yearStr, 10);

  if (isNaN(makeId) || isNaN(year)) {
    return NextResponse.json({ error: "Invalid makeId or year" }, { status: 400 });
  }

  // Check cache
  const cached = await prisma.vehicleModelCache.findMany({
    where: { makeId, year },
    orderBy: { modelName: "asc" },
  });

  if (cached.length > 0) {
    const age = Date.now() - cached[0].fetchedAt.getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.map((m) => m.modelName));
    }
  }

  // Fetch from NHTSA
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    const data = await res.json();
    const models: { Model_Name: string }[] = data.Results ?? [];
    const modelNames = [...new Set(models.map((m) => m.Model_Name))].sort();

    if (modelNames.length > 0) {
      await prisma.$transaction(
        modelNames.map((name) =>
          prisma.vehicleModelCache.upsert({
            where: { makeId_year_modelName: { makeId, year, modelName: name } },
            create: { makeId, year, modelName: name, fetchedAt: new Date() },
            update: { fetchedAt: new Date() },
          })
        )
      );
      return NextResponse.json(modelNames);
    }
  } catch {
    // Fall through
  }

  return NextResponse.json(cached.map((m) => m.modelName));
}
