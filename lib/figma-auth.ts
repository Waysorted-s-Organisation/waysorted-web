import User from "@/models/user";
import type { IUser } from "@/types/user";

export const REQUIRED_FIGMA_SCOPES = ["current_user:read", "file_comments:read"];

export type FigmaCredentialStatusReason =
  | "missing_pat"
  | "missing_scopes"
  | "pat_invalid_or_expired"
  | "figma_unreachable"
  | "valid";

export type FigmaCredentialStatus = {
  connected: boolean;
  reason: FigmaCredentialStatusReason;
  figmaUserId: string | null;
  connectedAt: Date | string | null;
  grantedScopes: string[];
  requiredScopes: string[];
  missingScopes: string[];
  validatedAt?: string;
};

export function getFigmaHeaders(token: string): Record<string, string> {
  return token.startsWith("figd_")
    ? { "X-Figma-Token": token }
    : { Authorization: `Bearer ${token}` };
}

export async function clearFigmaCredentials(userId: IUser["_id"]) {
  await User.findByIdAndUpdate(userId, {
    $unset: {
      figmaAccessToken: 1,
      figmaRefreshToken: 1,
      figmaTokenExpiresAt: 1,
      figmaScopes: 1,
      figmaUserId: 1,
      figmaConnectedAt: 1,
    },
  });
}

export async function validateFigmaToken(
  token: string,
  fileKey?: string | null,
): Promise<{ ok: boolean; status: number; figmaUserId?: string | null; reason?: string }> {
  const meResponse = await fetch("https://api.figma.com/v1/me", {
    method: "GET",
    headers: getFigmaHeaders(token),
  });

  if (!meResponse.ok) {
    return { ok: false, status: meResponse.status, reason: "me_check_failed" };
  }

  const me = await meResponse.json().catch(() => null);

  if (fileKey) {
    const commentsResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
      method: "GET",
      headers: getFigmaHeaders(token),
    });

    if (!commentsResponse.ok) {
      return {
        ok: false,
        status: commentsResponse.status,
        figmaUserId: me?.id || null,
        reason: "comments_check_failed",
      };
    }
  }

  return { ok: true, status: 200, figmaUserId: me?.id || null };
}

export async function getFigmaCredentialStatus(
  user: IUser,
  options: { validate?: boolean; fileKey?: string | null } = {},
): Promise<FigmaCredentialStatus> {
  const grantedScopes = user.figmaScopes || [];
  const missingScopes = REQUIRED_FIGMA_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  const base = {
    figmaUserId: user.figmaUserId || null,
    connectedAt: user.figmaConnectedAt || null,
    grantedScopes,
    requiredScopes: REQUIRED_FIGMA_SCOPES,
    missingScopes,
  };

  if (!user.figmaAccessToken) {
    return { ...base, connected: false, reason: "missing_pat" };
  }

  if (missingScopes.length > 0) {
    return { ...base, connected: false, reason: "missing_scopes" };
  }

  if (!options.validate) {
    return { ...base, connected: true, reason: "valid" };
  }

  try {
    const validation = await validateFigmaToken(user.figmaAccessToken, options.fileKey);

    if (!validation.ok) {
      if (validation.status === 401 || validation.status === 403) {
        await clearFigmaCredentials(user._id);
        return {
          ...base,
          connected: false,
          reason: "pat_invalid_or_expired",
          grantedScopes: [],
          missingScopes: REQUIRED_FIGMA_SCOPES,
          validatedAt: new Date().toISOString(),
        };
      }

      return {
        ...base,
        connected: false,
        reason: "figma_unreachable",
        validatedAt: new Date().toISOString(),
      };
    }

    if (validation.figmaUserId && validation.figmaUserId !== user.figmaUserId) {
      await User.findByIdAndUpdate(user._id, { figmaUserId: validation.figmaUserId });
    }

    return {
      ...base,
      connected: true,
      reason: "valid",
      figmaUserId: validation.figmaUserId || base.figmaUserId,
      validatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Figma credential validation failed:", error);
    return {
      ...base,
      connected: false,
      reason: "figma_unreachable",
      validatedAt: new Date().toISOString(),
    };
  }
}
