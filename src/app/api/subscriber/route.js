import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db"; // adjust path if needed
import Subscriber from "../../../models/subscriber";

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Basic validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Check if email already exists
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 200 }
      );
    }

    // Save new subscriber
    const newSubscriber = await Subscriber.create({ email });

    return NextResponse.json(
      {
        message: "Subscription successful",
        id: newSubscriber._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in subscription route:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
