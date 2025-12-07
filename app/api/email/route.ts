import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Email from "@/models/email";

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email format
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Try inserting directly - even if it already exists
    const saved = await Email.create({ email });

    return NextResponse.json(
      {
        message: "Email saved successfully",
        id: saved._id,
      },
      { status: 201 }
    );
  } catch (error) {
    // If duplicate key error happens, still return success
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { message: "Email already stored", status: "ok" },
        { status: 201 }
      );
    }

    console.error("Error in /api/email POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
