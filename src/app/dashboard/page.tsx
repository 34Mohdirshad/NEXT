import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let userId: string | null = null;
  let clerkUser = null;
  
  try {
    const authData = await auth();
    userId = authData.userId;
    
    // Safety check for Clerk Secrets
    if (!userId && !isPublicRouteForTesting()) {
       // Proceed to redirect or error below
    }
    
    clerkUser = await currentUser();
  } catch (err: any) {
    console.error("Clerk auth failed on dashboard:", err);
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0f] text-white p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Config Error</h2>
        <p className="text-gray-300 max-w-md">
           The application failed to initialize authentication. This is almost always due to <b>missing environment variables on Vercel</b>.
        </p>
        <div className="mt-6 p-4 bg-black/40 border border-red-900/50 rounded-lg text-left text-xs text-red-400 font-mono">
           Ensure you added:
           <br/>- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
           <br/>- CLERK_SECRET_KEY
           <br/>- NEXT_PUBLIC_CLERK_SIGN_IN_URL
        </div>
      </div>
    );
  }

  function isPublicRouteForTesting() { return false; }

  if (!userId) redirect("/sign-in");

  let workflows = [];
  try {
    // Ensure user exists in DB
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
          name: clerkUser?.firstName
             ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
             : null,
        },
      });
    }

    workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        executions: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });
  } catch (err: any) {
    console.error("Database Error on Dashboard:", err);
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 text-center bg-[#0a0a0f] text-white">
        <div className="max-w-md bg-red-950/30 p-8 rounded-xl border border-red-900/50 flex flex-col items-center">
            <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h2 className="text-xl font-bold mb-2 text-red-200">Database Connection Error</h2>
            <p className="text-sm text-red-300">
                The application could not retrieve your workflows from the database. 
                This usually happens if your <b>DATABASE_URL</b> is incorrect or if you haven't initialized your database tables yet using <code className="bg-black px-1 py-0.5 rounded">npx prisma db push</code>.
            </p>
            <p className="text-xs text-red-400 mt-4 opacity-70 border-t border-red-900/50 pt-4 w-full truncate">
                {err?.message || "Unknown Prisma Error"}
            </p>
        </div>
      </div>
    );
  }

  return <DashboardClient workflows={JSON.parse(JSON.stringify(workflows))} />;
}
