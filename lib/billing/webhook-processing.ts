export const WEBHOOK_PROCESSING_LEASE_MS = 2 * 60_000;

const RETRYABLE_IGNORED_REASONS = new Set([
  "purchase_not_found",
  "subscription_not_found",
]);

export function isRetryableWebhookIgnoreReason(reason: unknown) {
  return typeof reason === "string" && RETRYABLE_IGNORED_REASONS.has(reason);
}

export function isTerminalWebhookStatus(status: unknown) {
  return status === "processed" || status === "ignored";
}

function webhookEntityId(payload: Record<string, unknown>, key: string) {
  const body = (payload.payload as Record<string, unknown> | undefined) || {};
  const container = body[key] as { entity?: Record<string, unknown> } | undefined;
  return typeof container?.entity?.id === "string" ? container.entity.id : "";
}

export function deriveRazorpayEventId(
  payload: Record<string, unknown>,
  providerEventId?: string | null,
) {
  const headerId = providerEventId?.trim();
  if (headerId) return headerId;

  const eventType = String(payload.event || "unknown");
  const entityId = ["payment", "refund", "order", "subscription", "invoice"]
    .map((key) => webhookEntityId(payload, key))
    .find(Boolean);
  const createdAt = payload.created_at === undefined ? "" : String(payload.created_at);
  if (!entityId) return null;
  return [eventType, entityId, createdAt].filter(Boolean).join(":");
}

export function sanitizeRazorpayWebhookPayload(payload: Record<string, unknown>) {
  const body = (payload.payload as Record<string, unknown> | undefined) || {};
  const sanitizedPayload: Record<string, unknown> = {};

  for (const key of ["payment", "refund", "order", "subscription", "invoice"]) {
    const entity = (body[key] as { entity?: Record<string, unknown> } | undefined)?.entity;
    if (!entity) continue;
    sanitizedPayload[key] = {
      entity: {
        id: entity.id || null,
        order_id: entity.order_id || null,
        payment_id: entity.payment_id || null,
        subscription_id: entity.subscription_id || null,
        amount: entity.amount ?? null,
        currency: entity.currency || null,
        status: entity.status || null,
      },
    };
  }

  return {
    event: String(payload.event || "unknown"),
    created_at: payload.created_at ?? null,
    payload: sanitizedPayload,
  };
}

export function buildWebhookLeaseTimes(
  now = new Date(),
  leaseMs = WEBHOOK_PROCESSING_LEASE_MS,
) {
  return {
    processingStartedAt: now,
    processingLeaseExpiresAt: new Date(now.getTime() + leaseMs),
  };
}

export function buildWebhookClaimFilter(
  eventId: string,
  now = new Date(),
  leaseMs = WEBHOOK_PROCESSING_LEASE_MS,
) {
  const staleLegacyCutoff = new Date(now.getTime() - leaseMs);
  return {
    eventId,
    $or: [
      { status: { $in: ["received", "failed"] } },
      {
        status: "processing",
        processingLeaseExpiresAt: { $lte: now },
      },
      {
        status: "processing",
        processingLeaseExpiresAt: null,
        updatedAt: { $lte: staleLegacyCutoff },
      },
    ],
  };
}
