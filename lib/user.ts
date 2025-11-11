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

    if (!session?.user) return null;

    // Type guard to ensure user is populated
    const user = session.user;
    if (typeof user === 'object' && user !== null && '_id' in user && 'email' in user) {
      const populatedUser = user as {
        _id: { toString(): string };
        name?: string;
        email: string;
        picture?: string;
        favorites?: string[];
        earlyAccess?: boolean;
        creditsRemaining?: number;
      };

      const initials =
        populatedUser.name
          ?.split(/\s+/)
          .map((s: string) => s[0]?.toUpperCase())
          .slice(0, 2)
          .join("") || populatedUser.email.slice(0, 2).toUpperCase();

      return {
        id: populatedUser._id.toString(),
        name: populatedUser.name ?? null,
        email: populatedUser.email,
        picture: populatedUser.picture ?? null,
        favorites: populatedUser.favorites ?? [],
        earlyAccess: !!populatedUser.earlyAccess,
        initials,
        creditsRemaining: populatedUser.creditsRemaining ?? 0,
      };
    }

    return null;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}