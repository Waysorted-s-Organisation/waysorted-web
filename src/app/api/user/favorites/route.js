// /app/api/user/favorites/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/db";
import Session from "../../../../models/session";
import User from "../../../../models/user";

// ... (existing imports)

export async function PUT(req) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const { toolId, action } = await req.json();
  if (!toolId || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  await dbConnect();
  const session = await Session.findOne({ accessToken: token }).lean();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const update =
    action === "add"
      ? { $addToSet: { favorites: toolId } }
      : { $pull: { favorites: toolId } };

  const user = await User.findByIdAndUpdate(session.user, update, {
    new: true,
  });

  return NextResponse.json({ favorites: user.favorites });
}
