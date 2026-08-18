import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import UserBilling from "@/models/userBilling";
import dbConnect from "@/lib/db";
import { ensureUserBilling } from "@/lib/billing/db";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, email, address, country, city, zipCode } = body;

    if (!firstName || !lastName || !email || !address || !country || !city || !zipCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await ensureUserBilling(auth.user);
    const updated = await UserBilling.findOneAndUpdate(
      { user: auth.user._id },
      {
        $set: {
          billingDetails: {
            firstName,
            lastName,
            email,
            address,
            country,
            city,
            zipCode,
          },
        },
      },
      { new: true }
    );
    if (!updated) throw new Error("Billing wallet was not initialized.");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/billing/details error:", error);
    return NextResponse.json(
      { error: "Unable to save billing details" },
      { status: 500 },
    );
  }
}
