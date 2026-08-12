import type { UsageReservationStatus } from "@/models/usageReservation";

type ExistingReservation = {
  status: UsageReservationStatus;
  featureCode: string;
  toolCode?: string | null;
  sizeBucket?: string | null;
  creditsReserved: number;
  processor?: string | null;
  selectedOptions?: Record<string, unknown>;
  expiresAt: Date;
};

type RequestedReservation = {
  featureCode: string;
  toolCode?: string | null;
  sizeBucket?: string | null;
  creditsRequired: number;
  processor?: string | null;
  selectedOptions?: Record<string, unknown>;
};

function conflict(message: string) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = 409;
  return error;
}

export function assertReservationReplayAllowed(
  existing: ExistingReservation,
  requested: RequestedReservation,
) {
  if (existing.status !== "reserved") {
    throw conflict("Idempotency key has already been used by a completed reservation.");
  }
  if (existing.expiresAt.getTime() <= Date.now()) {
    throw conflict("Idempotency key belongs to an expired reservation.");
  }

  const normalizeOptions = (value?: Record<string, unknown>) =>
    JSON.stringify(
      Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right)),
    );

  const matchesOriginalRequest =
    existing.featureCode === requested.featureCode &&
    (existing.toolCode || null) === (requested.toolCode || null) &&
    (existing.sizeBucket || null) === (requested.sizeBucket || null) &&
    existing.creditsReserved === requested.creditsRequired &&
    (existing.processor || null) === (requested.processor || null) &&
    normalizeOptions(existing.selectedOptions) === normalizeOptions(requested.selectedOptions);

  if (!matchesOriginalRequest) {
    throw conflict("Idempotency key was already used for a different reservation request.");
  }
}
