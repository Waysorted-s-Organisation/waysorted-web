import dbConnect from "@/lib/db";
import Session, { ISession } from "@/models/session";
import type { IUser, IUserMethods } from "@/models/user";
import { cookies } from "next/headers";
import type { HydratedDocument } from "mongoose";

type PopulatedSession = Omit<ISession, "user"> & {
  user: HydratedDocument<IUser, IUserMethods>;
};

export type PublicUser = ReturnType<IUserMethods["toPublic"]>;

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    // Inspect cookies seen by the server
    const cookieStore = await cookies();
    // Log all cookies (for production inspect your provider logs)
    // cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));

    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) return null;

    await dbConnect();
    const session = (await Session.findOne({ sessionId }).populate("user").exec()) as
      | PopulatedSession
      | null;

    if (!session?.user) return null;
    return session.user.toPublic();
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}