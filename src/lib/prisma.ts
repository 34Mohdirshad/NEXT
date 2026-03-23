import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Use LibSQL adapter for Turso (URL starts with libsql:// or https://)
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    if (!authToken && url.startsWith("libsql://")) {
        console.warn("DATABASE_AUTH_TOKEN is missing for LibSQL connection.");
    }
    const libsql = createClient({
      url,
      authToken,
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter });
  }

  if (process.env.NODE_ENV === "production" && (!url || url.startsWith("file:"))) {
    console.error("No production database URL found. Please set DATABASE_URL to a Turso (libsql://) or other remote database.");
  }

  // Standard Prisma Client for local SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

