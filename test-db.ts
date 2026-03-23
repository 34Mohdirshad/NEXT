import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    console.log("Testing connection...");
    await prisma.$connect();
    console.log("Connected successfully!");
    
    // Check if tables exist
    const userCount = await prisma.user.count();
    console.log("Database initialized properly. User count:", userCount);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
