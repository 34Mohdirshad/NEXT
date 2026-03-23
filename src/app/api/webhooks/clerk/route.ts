import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clerk webhook – creates/updates user records in our DB
// Set CLERK_WEBHOOK_SECRET in .env.local and configure endpoint in Clerk Dashboard
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === "user.created" || type === "user.updated") {
      const { id: clerkId, email_addresses, first_name, last_name } = data;
      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      if (!email) return NextResponse.json({ ok: true });

      await prisma.user.upsert({
        where: { clerkId },
        update: { email, name },
        create: { clerkId, email, name },
      });
    }

    if (type === "user.deleted") {
      const { id: clerkId } = data;
      await prisma.user.deleteMany({ where: { clerkId } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CLERK_WEBHOOK]", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
