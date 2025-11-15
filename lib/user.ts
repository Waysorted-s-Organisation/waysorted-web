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

    // session.user can be ObjectId (unpopulated) or full user object
    // Type assertion needed for Mongoose populate to work properly
    const user = session.user as unknown as {
      _id: { toString(): string };
      name?: string | null;
      email: string;
      picture?: string | null;
      favorites?: string[];
      earlyAccess?: boolean;
      creditsRemaining?: number;
    };

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