import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import UserBilling from "@/models/userBilling";
import dbConnect from "@/lib/db";
import { ensureUserBilling } from "@/lib/billing/db";
import { validateBillingDetails } from "@/lib/billing/billing-details";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const auth = await getAuthenticatedUser(request);
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, email, address, country, city, zipCode } = body;

    // Validated HERE, not only in the form. The client's `pattern` attributes
    // are a hint to a cooperating browser; this endpoint is reachable directly,
    // and it previously stored anything non-empty. These values end up on
    // invoices and in tax records.
    const validationErrors = validateBillingDetails({
      firstName,
      lastName,
      email,
      address,
      country,
      city,
      zipCode,
    });
    if (validationErrors.length) {
      return NextResponse.json(
        {
          error: validationErrors[0].message,
          code: "billing_details_invalid",
          fields: validationErrors,
        },
        { status: 400 },
      );
    }

    await ensureUserBilling(auth.user);
    const updated = await UserBilling.findOneAndUpdate(
      { user: auth.user._id },
      {
        $set: {
          billingDetails: {
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: String(email).trim(),
            address: String(address).trim(),
            country: String(country).trim(),
            city: String(city).trim(),
            zipCode: String(zipCode).trim().toUpperCase(),
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
