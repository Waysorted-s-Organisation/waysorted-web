import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Session from "@/models/session";

export async function PUT(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { avatar } = await req.json();

  if (!token || !avatar) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  await dbConnect();
  await Session.updateOne(
    { accessToken: token },
    { $set: { "user.avatar": avatar } }
  );

  return NextResponse.json({ message: "Avatar updated" });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  await dbConnect();
  const session = await Session.findOne(
    { accessToken: token },
    { "user.avatar": 1, _id: 0 }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatar = (session as any)?.user?.avatar ?? null;
  return NextResponse.json({ avatar });
}
