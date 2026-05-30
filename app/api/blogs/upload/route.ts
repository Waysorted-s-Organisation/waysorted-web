import { NextRequest, NextResponse } from "next/server";
import { uploadBlogImageToCloudinary } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || !image.size) {
      return NextResponse.json({ message: "Image is required" }, { status: 400 });
    }

    const upload = await uploadBlogImageToCloudinary(image);
    return NextResponse.json({ data: upload }, { status: 201 });
  } catch (err) {
    console.error("POST /api/blogs/upload error", err);
    const message = err instanceof Error ? err.message : "Failed to upload blog image";
    return NextResponse.json({ message }, { status: 400 });
  }
}

