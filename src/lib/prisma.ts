import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Use LibSQL adapter for Turso (URL starts with libsql:// or https://)
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    const libsql = createClient({
      url,
      authToken,
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter });
  }

  // Fallback to SQLite (Standard Prisma Client)
  let finalUrl = url;
  if (!finalUrl || finalUrl.startsWith("file:.")) {
      // Force absolute path for SQLite to avoid ambiguous relative path issues in Next.js
      finalUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }

  console.log(`[PRISMA] Database Target: ${finalUrl}`);
  
  return new PrismaClient({
    datasources: {
      db: {
        url: finalUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

