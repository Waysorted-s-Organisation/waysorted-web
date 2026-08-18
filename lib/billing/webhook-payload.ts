type RazorpayEntity = Record<string, unknown>;

function entityFrom(
  payload: Record<string, unknown>,
  key: "invoice" | "subscription" | "payment",
) {
  return (payload[key] as { entity?: RazorpayEntity } | undefined)?.entity;
}

function epochDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

function present(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function resolvePaidSubscriptionCycle(bodyPayload: Record<string, unknown>) {
  const invoice = entityFrom(bodyPayload, "invoice");
  const subscription = entityFrom(bodyPayload, "subscription");
  const payment = entityFrom(bodyPayload, "payment");

  const subscriptionId = String(invoice?.subscription_id || subscription?.id || "");
  const paymentId = String(invoice?.payment_id || payment?.id || "");
  const periodStart = invoice?.period_start ?? subscription?.current_start;
  const periodEnd = invoice?.period_end ?? subscription?.current_end;
  const paidCount = subscription?.paid_count;

  // A payment may produce both invoice.paid and subscription.charged. Prefer
  // the payment identity so both webhook shapes resolve to the same cycle key.
  const cycleIdentity = paymentId
    ? `payment:${paymentId}`
    : present(invoice?.id)
      ? `invoice:${String(invoice?.id)}`
      : present(periodStart) || present(periodEnd)
        ? `period:${String(periodStart ?? "")}:${String(periodEnd ?? "")}`
        : present(paidCount)
          ? `paid-count:${String(paidCount)}`
          : "";

  const currentPeriodEnd = epochDate(periodEnd);
  return {
    subscriptionId,
    paymentId,
    cycleIdentity,
    currentPeriodStart: epochDate(periodStart),
    currentPeriodEnd,
    nextChargeAt: epochDate(subscription?.charge_at) || currentPeriodEnd,
  };
}

/**
 * Ledger idempotency key for one paid subscription cycle.
 *
 * Shared by the subscription.charged webhook and the renewal backstop so both write the SAME key.
 * creditledgers.idempotencyKey is uniquely indexed in production, so identical keys make whichever
 * path arrives second a harmless no-op. A divergent format double-credits instead - which is
 * exactly what happened to the first paying customer, whose two grants differed only by an
 * inserted ":payment:" segment.
 */
export function buildSubscriptionCycleKey(providerSubscriptionId: string, paymentId: string) {
  return `${providerSubscriptionId}:payment:${paymentId}`;
}
