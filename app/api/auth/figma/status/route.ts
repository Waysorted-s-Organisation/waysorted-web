import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/billing/auth";

const REQUIRED_FIGMA_SCOPES = ["current_user:read", "file_comments:read"];

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);

  if (!auth?.user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const grantedScopes = auth.user.figmaScopes || [];
  const missingScopes = REQUIRED_FIGMA_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );
  const connected = Boolean(auth.user.figmaAccessToken) && missingScopes.length === 0;

  return NextResponse.json({
    connected,
    figmaUserId: auth.user.figmaUserId || null,
    connectedAt: auth.user.figmaConnectedAt || null,
    grantedScopes,
    requiredScopes: REQUIRED_FIGMA_SCOPES,
    missingScopes,
  });
}
