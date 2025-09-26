import dbConnect from "@/lib/db";
import User from "@/models/user";
import Session from "@/models/session";
import { cookies } from "next/headers";

export type User = {
  id: string;
  name: string;
  email: string;
  initials: string;
  earlyAccess: boolean;
  creditsRemaining: number;
};

export async function getCurrentUser(): Promise<User | null> {
  await dbConnect();

  // Get session cookie
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) return null;

  // Find session and populate user
  const session = await Session.findOne({ sessionId }).populate("user").lean() as any;
  if (!session || !session.user) return null;

  const u = session.user;

  // Calculate initials
  const initials =
    (u.name
      ?.split(/\s+/)
      .map((s: string) => s[0].toUpperCase())
      .slice(0, 2)
      .join("") || u.email.slice(0, 2).toUpperCase()) ?? "NA";

  return {
    id: u._id.toString(),
    name: u.name || "",
    email: u.email,
    initials,
    earlyAccess: u.earlyAccess,
    creditsRemaining: u.creditsRemaining ?? (u.earlyAccess ? 200 : 5),
  };
}
