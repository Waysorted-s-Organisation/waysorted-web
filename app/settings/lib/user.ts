import dbConnect from "@/lib/db";
import Session, { ISession } from "@/models/session";
import type { IUser, IUserMethods } from "@/models/user";
import { cookies } from "next/headers";
import type { HydratedDocument } from "mongoose";

// A session where user is populated
type PopulatedSession = Omit<ISession, "user"> & {
  user: HydratedDocument<IUser, IUserMethods>;
};

// The public user shape we return
export type PublicUser = ReturnType<IUserMethods["toPublic"]>;

export async function getCurrentUser(): Promise<PublicUser | null> {
  await dbConnect();

  // Get session cookie
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) return null;

  // Find session and populate user
  const session = await Session.findOne({ sessionId })
    .populate("user")
    .exec() as (PopulatedSession | null);

  if (!session?.user) return null;

  // Use the model's built-in method to build a safe DTO
  return session.user.toPublic();
}
