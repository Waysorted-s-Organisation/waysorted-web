import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "../../../lib/db";
import Email from "../../../models/email";

// Zod schema to validate email format
const emailSchema = z.object({
  email: z.string().email(),
});

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate request with Zod
    const { email } = emailSchema.parse(body);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // If duplicate key error happens, still return success
    if (error.code === 11000) {
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
