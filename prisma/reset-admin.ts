import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  // Load .env
  const lines = readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]+)"?/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash("Admin@Expert2024", 12);
  const result = await prisma.user.updateMany({
    where: { username: "admin" },
    data: { hashedPassword: hash, failedLoginAttempts: 0, isLocked: false },
  });
  console.log("Updated rows:", result.count);
  await prisma.$disconnect();
}

main().catch(console.error);
