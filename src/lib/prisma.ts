import { existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const bundledDatabasePath = join(process.cwd(), "data", "app.db");
const configuredDatabaseUrl = process.env.DATABASE_URL ?? "";
const shouldUseBundledDatabase =
  existsSync(bundledDatabasePath) &&
  (
    !configuredDatabaseUrl ||
    configuredDatabaseUrl.startsWith("file:/Users/")
  );

if (shouldUseBundledDatabase && (process.env.VERCEL || process.env.NODE_ENV === "production")) {
  process.env.DATABASE_URL = `file:${bundledDatabasePath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
