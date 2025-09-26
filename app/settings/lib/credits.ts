import User from "@/models/user";
import dbConnect from "@/lib/db";

export async function fetchUserCredits(userId: string) {
  await dbConnect();
  const user = await User.findById(userId);
  if (!user) return { used: 0, total: 0 };

  const total = user.earlyAccess ? 200 : 5;
  const used = total - user.creditsRemaining;
  return { used, total };
}
