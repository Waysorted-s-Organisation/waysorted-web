import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";
import type { IUser } from "@/types/user";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { sessionExpiryFilter } from "@/lib/auth-session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;
  await dbConnect();
  const session = await Session.findOne({
    sessionId,
    completed: true,
    user: { $exists: true, $ne: null },
    ...sessionExpiryFilter(),
  }).populate<{ user: IUser }>("user");
  if (!session || !session.user) return null;
  return session.user;
}
