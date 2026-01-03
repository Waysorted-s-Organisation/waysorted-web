import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/models/user";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) return null;
  await dbConnect();
  const session = await Session.findOne({ sessionId }).populate<{ user: IUser }>("user");
  if (!session || !session.user) return null;
  return session.user;
}
