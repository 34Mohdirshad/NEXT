import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { id } = await params;
    const body = await req.json();
    const { name, description, definition } = body;

    const workflow = await prisma.workflow.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        name,
        description,
        definition,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOW_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { id } = await params;

    const workflow = await prisma.workflow.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("[WORKFLOW_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
