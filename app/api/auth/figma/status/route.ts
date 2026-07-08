import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";
import { getFigmaCredentialStatus } from "@/lib/figma-auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);

  if (!auth?.user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const validate = searchParams.get("validate") === "true";
  const fileKey = searchParams.get("fileKey");
  const status = await getFigmaCredentialStatus(auth.user, { validate, fileKey });

  return NextResponse.json(status);
}
