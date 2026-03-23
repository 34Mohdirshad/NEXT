import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrismaV2 = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DIRECT URL - NO "UNDEFINED" POSSIBLE!
const TURSO_URL = "libsql://workflow-builder-34mohdirshad.aws-ap-south-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQyNjU0NjYsImlkIjoiMDE5ZDFhNmYtN2IwMS03MmFjLTlhZmEtZmMyMWNiMmFkOTljIiwicmlkIjoiMjZmZmVmNTktMDdlOS00NWQ0LTlhMmMtNTAxOGE1NTAwZDM3In0.hL8ClTmN_WG0TqmzA_s83Z3uf5Q3XEbmt98LgHbGolutO7tK3ibwwXR16vilc2guO3mslo09B74QxxZYKlS4Bw";

const createPrismaClient = () => {
  console.log("[PRISMA] Connecting to Turso (Cloud)...");
  
  const adapter = new PrismaLibSQL({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  return new PrismaClient({ 
    adapter,
    log: ["error", "warn"]
  });
};

export const prisma = globalForPrismaV2.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrismaV2.prisma = prisma;
