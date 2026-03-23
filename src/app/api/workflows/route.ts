import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200).default("Untitled Workflow"),
  description: z.string().max(1000).optional(),
  definition: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        definition: parsed.data.definition || { nodes: [], edges: [] },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOWS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        executions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("[WORKFLOWS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
