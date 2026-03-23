import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert to base64 data URI for immediate use
    // In production: upload to Transloadit/S3 and return the public URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || (type === "video" ? "video/mp4" : "image/jpeg");
    const dataUri = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      url: dataUri,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
