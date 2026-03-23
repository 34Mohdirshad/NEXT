import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkflowEditor from "./workflow-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/dashboard");

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });

  if (!workflow) notFound();

  return (
    <WorkflowEditor
      workflow={JSON.parse(JSON.stringify(workflow))}
    />
  );
}
