"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import User from "@/models/user";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

// Helper to authenticate user inside server action
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  await dbConnect();
  const session = await Session.findOne({ sessionId });
  
  if (!session || !session.user) return null;
  return session.user; // Returns the user ID
}

export async function updateName(newName: string) {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) throw new Error("Unauthorized");

    if (!newName || newName.trim().length === 0) {
      throw new Error("Name cannot be empty");
    }

    await User.findByIdAndUpdate(userId, { name: newName.trim() });
    
    // Refresh the page data
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("Update name error:", error);
    return { success: false, error: "Failed to update name" };
  }
}

export async function removeProfilePicture() {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) throw new Error("Unauthorized");

    await User.findByIdAndUpdate(userId, { picture: null });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Remove picture error:", error);
    return { success: false, error: "Failed to remove picture" };
  }
}

export async function updateProfilePicture(formData: FormData) {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");
    // Convert file to buffer then base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    await User.findByIdAndUpdate(userId, { picture: base64Image });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Upload picture error:", error);
    return { success: false, error: "Failed to upload picture" };
  }
}
