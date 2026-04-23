import { createHmac } from "crypto";
import { getStarterGrantSecret } from "@/lib/billing/env";

function hashSignal(value: string) {
  return createHmac("sha256", getStarterGrantSecret()).update(value).digest("hex");
}

function normalizeIp(ip: string | null) {
  if (!ip) return null;
  return ip.includes(",") ? ip.split(",")[0].trim() : ip.trim();
}

function normalizeIpPrefix(ip: string | null) {
  if (!ip) return null;

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
  }

  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}::/64`;
  }

  return ip;
}

export function extractRequestSignals(request: Request | { headers: Headers }) {
  const headers = request.headers;
  const ip =
    normalizeIp(headers.get("x-forwarded-for")) ||
    normalizeIp(headers.get("x-real-ip")) ||
    normalizeIp(headers.get("cf-connecting-ip"));
  const ipPrefix = normalizeIpPrefix(ip);
  const userAgent = headers.get("user-agent")?.trim() || null;
  const deviceId = headers.get("x-waysorted-device-id")?.trim() || null;

  return {
    ipAddress: ip,
    ipPrefix,
    userAgent,
    deviceId,
  };
}

export function buildStarterSignalHashes(input: {
  email: string;
  googleSub?: string | null;
  ipPrefix?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}) {
  return {
    emailHash: hashSignal(input.email.trim().toLowerCase()),
    googleSubHash: input.googleSub ? hashSignal(input.googleSub.trim()) : null,
    ipPrefixHash: input.ipPrefix ? hashSignal(input.ipPrefix) : null,
    userAgentHash: input.userAgent ? hashSignal(input.userAgent) : null,
    deviceFingerprintHash: input.deviceId ? hashSignal(input.deviceId) : null,
  };
}
