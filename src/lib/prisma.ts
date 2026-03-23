import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Use user-provided Turso URL directly to bypass local environment confusion
  const url = process.env.DATABASE_URL || "libsql://workflow-builder-34mohdirshad.aws-ap-south-1.turso.io";
  const authToken = process.env.DATABASE_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQyNjU0NjYsImlkIjoiMDE5ZDFhNmYtN2IwMS03MmFjLTlhZmEtZmMyMWNiMmFkOTljIiwicmlkIjoiMjZmZmVmNTktMDdlOS00NWQ0LTlhMmMtNTAxOGE1NTAwZDM3In0.hL8ClTmN_WG0TqmzA_s83Z3uf5Q3XEbmt98LgHbGolutO7tK3ibwwXR16vilc2guO3mslo09B74QxxZYKlS4Bw";

  // Use LibSQL adapter for Turso (URL starts with libsql:// or https://)
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    const libsql = createClient({
      url,
      authToken,
    });
    const adapter = new PrismaLibSQL(libsql as any);
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

