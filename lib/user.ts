import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

export interface CurrentUser {
  id: string;
  name?: string | null;
  email: string;
  picture?: string | null;
  favorites: string[];
  earlyAccess: boolean;
  initials: string;
  creditsRemaining: number;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) return null;

    // Connect to DB and fetch session -> user
    await dbConnect();

    const session = await Session.findOne({ sessionId }).populate("user");

    if (!session || !session.user) return null;

    // session.user may be either an ObjectId (not populated) or a populated user object.
    const maybeUser = session.user;

    // Narrow to a populated user object at runtime to avoid using `any`.
    type PopulatedUser = {
      _id: { toString(): string } | string;
      name?: string | null;
      email: string;
      picture?: string | null;
      favorites?: string[];
      earlyAccess?: boolean;
      creditsRemaining?: number;
    };

    if (!maybeUser || typeof maybeUser !== "object" || !("email" in maybeUser)) {
      return null;
    }

  // Force through unknown to satisfy TypeScript when mongoose ObjectId types overlap.
  const user = (maybeUser as unknown) as PopulatedUser;

    const initials =
      user.name
        ?.split(/\s+/)
        .map((s: string) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || user.email.slice(0, 2).toUpperCase();

    return {
      id: user._id.toString(),
      name: user.name ?? null,
      email: user.email,
      picture: user.picture ?? null,
      favorites: user.favorites ?? [],
      earlyAccess: !!user.earlyAccess,
      initials,
      creditsRemaining: user.creditsRemaining ?? 0,
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}