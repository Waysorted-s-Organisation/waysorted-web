const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeN4CanaryEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function parseN4CanaryEmails(value: string | undefined) {
  return new Set(
    String(value || "")
      .split(",")
      .map(normalizeN4CanaryEmail)
      .filter(Boolean),
  );
}

export function validateN4CanaryTestTarget(input: {
  enabled: string | undefined;
  allowlist: string | undefined;
  requestedEmail: unknown;
}) {
  if (String(input.enabled || "").trim() !== "true") {
    return { ok: false as const, status: 409, error: "N4 canary simulation is disabled" };
  }

  const email = normalizeN4CanaryEmail(input.requestedEmail);
  if (!email || !email.includes("@")) {
    return { ok: false as const, status: 400, error: "A valid canary email is required" };
  }

  const allowed = parseN4CanaryEmails(input.allowlist);
  if (!allowed.has(email)) {
    return { ok: false as const, status: 403, error: "Email is not in the N4 producer canary allowlist" };
  }

  return { ok: true as const, email };
}

export function getN4CanarySimulationTime(
  lastActivityAt: Date,
  inactivityDays: number,
) {
  if (!(lastActivityAt instanceof Date) || Number.isNaN(lastActivityAt.getTime())) {
    throw new Error("Latest activity timestamp is invalid");
  }
  const normalizedDays = Number.isFinite(inactivityDays) && inactivityDays > 0
    ? Math.floor(inactivityDays)
    : 7;
  return new Date(lastActivityAt.getTime() + normalizedDays * DAY_MS + 60 * 1000);
}
