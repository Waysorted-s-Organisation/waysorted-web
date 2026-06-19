type NotificationProfile = {
  user_id?: string;
  email?: string;
  first_name?: string;
  display_name?: string;
  source?: string;
  traits?: Record<string, unknown>;
  consent?: Record<string, unknown>;
  preferences?: Record<string, string>;
};

type NotificationEventInput = {
  eventId: string;
  eventType: string;
  occurredAt?: Date;
  profile?: NotificationProfile;
  payload?: Record<string, unknown>;
  traits?: Record<string, unknown>;
};

type NotificationProducerConfig = {
  ingestUrl: string;
  ingestToken: string;
  source: string;
  timeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_HEAVY_USAGE_CREDIT_THRESHOLD = 100;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function compactEventPart(value: string | number | undefined | null) {
  const normalized = String(value ?? "unknown")
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]+/g, "-");
  return (normalized || "unknown").slice(0, 80);
}

function buildEventId(prefix: string, parts: Array<string | number | undefined | null>) {
  return [prefix, ...parts.map(compactEventPart)].join(":").slice(0, 120);
}

function buildProfile(input: {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  source: string;
  traits?: Record<string, unknown>;
}): NotificationProfile | undefined {
  if (!input.userId && !input.email) {
    return undefined;
  }

  return {
    user_id: input.userId || undefined,
    email: input.email || undefined,
    first_name: getFirstName(input.name),
    display_name: input.name?.trim() || undefined,
    source: input.source,
    traits: input.traits,
  };
}

function getNotificationProducerConfig(): NotificationProducerConfig | null {
  if (process.env.NOTIFICATION_PRODUCER_ENABLED?.trim() === "false") {
    return null;
  }

  const ingestUrl = process.env.NOTIFICATION_INGEST_URL?.trim();
  const ingestToken = process.env.NOTIFICATION_INGEST_TOKEN?.trim();
  const source = process.env.NOTIFICATION_EVENT_SOURCE?.trim();

  if (!ingestUrl || !ingestToken || !source) {
    return null;
  }

  return {
    ingestUrl,
    ingestToken,
    source,
    timeoutMs: parsePositiveInt(
      process.env.NOTIFICATION_INGEST_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS
    ),
  };
}

function getFirstName(name?: string | null) {
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName || undefined;
}

export function getHeavyUsageCreditThreshold() {
  return parsePositiveInt(
    process.env.NOTIFICATION_HEAVY_USAGE_CREDIT_THRESHOLD,
    DEFAULT_HEAVY_USAGE_CREDIT_THRESHOLD
  );
}

export function buildAccountActivatedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  provider: string;
  occurredAt?: Date;
  sourceContext?: Record<string, unknown>;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: `account_activated:${input.userId}`,
    eventType: "account_activated",
    occurredAt,
    profile: {
      user_id: input.userId,
      email: input.email,
      first_name: getFirstName(input.name),
      display_name: input.name?.trim() || undefined,
      source: input.provider,
      traits: {
        auth_provider: input.provider,
        ...input.sourceContext,
      },
      consent: {
        newsletter_auto_subscribe: {
          status: "subscribed",
          source: input.provider,
          captured_at: occurredAt.toISOString(),
        },
      },
    },
    payload: {
      auth_provider: input.provider,
      auto_subscribed: true,
      ...input.sourceContext,
    },
  } satisfies NotificationEventInput;
}

export function buildNotificationPreferencesUpdatedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  preferences: Record<string, string>;
  unsubscribedAll: boolean;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: `notification_preferences_updated:${input.userId}:${occurredAt.getTime()}`,
    eventType: input.unsubscribedAll
      ? "notification_unsubscribed"
      : "notification_preferences_updated",
    occurredAt,
    profile: {
      user_id: input.userId,
      email: input.email,
      first_name: getFirstName(input.name),
      display_name: input.name?.trim() || undefined,
      source: "settings",
      preferences: input.preferences,
    },
    payload: {
      preferences: input.preferences,
      unsubscribed_all: input.unsubscribedAll,
    },
  } satisfies NotificationEventInput;
}

export function buildFeedbackSubmittedEvent(input: {
  feedbackId: string;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  rating: number;
  commentLength: number;
  path?: string | null;
  isAnonymous: boolean;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("feedback_submitted", [input.feedbackId]),
    eventType: "feedback_submitted",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "feedback",
      traits: {
        latest_feedback_rating: input.rating,
      },
    }),
    payload: {
      feedback_id: input.feedbackId,
      rating: input.rating,
      has_comment: input.commentLength > 0,
      comment_length: input.commentLength,
      path: input.path || null,
      is_anonymous: input.isAnonymous,
    },
    traits: {
      latest_feedback_rating: input.rating,
    },
  } satisfies NotificationEventInput;
}

export function buildCreditsLowEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  eventKey: string;
  featureCode: string;
  toolCode?: string | null;
  creditsRequired: number;
  availableCredits: number;
  heldCredits?: number;
  reason: "insufficient_credits" | "post_reservation_low_balance";
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("credits_low", [input.userId, input.eventKey]),
    eventType: "credits_low",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_usage",
      traits: {
        credits_available: input.availableCredits,
        credits_held: input.heldCredits ?? 0,
      },
    }),
    payload: {
      feature_code: input.featureCode,
      tool_code: input.toolCode || null,
      credits_required: input.creditsRequired,
      available_credits: input.availableCredits,
      held_credits: input.heldCredits ?? 0,
      reason: input.reason,
    },
    traits: {
      credits_available: input.availableCredits,
      credits_held: input.heldCredits ?? 0,
    },
  } satisfies NotificationEventInput;
}

export function buildBillingBlockedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  eventKey: string;
  featureCode: string;
  toolCode?: string | null;
  creditsRequired: number;
  reason: "subscription_required";
  checkoutTarget: string;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("billing_blocked", [input.userId, input.eventKey]),
    eventType: "billing_blocked",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_usage",
    }),
    payload: {
      feature_code: input.featureCode,
      tool_code: input.toolCode || null,
      credits_required: input.creditsRequired,
      reason: input.reason,
      checkout_target: input.checkoutTarget,
    },
  } satisfies NotificationEventInput;
}

export function buildSubscriptionCheckoutStartedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  purchaseId: string;
  subscriptionId: string;
  productCode: string;
  amountSubunits: number;
  currency: string;
  pricingTier?: string | null;
  pricingCountry?: string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("subscription_checkout_started", [input.purchaseId]),
    eventType: "subscription_checkout_started",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_subscription",
      traits: {
        pricing_tier: input.pricingTier || null,
        pricing_country: input.pricingCountry || null,
      },
    }),
    payload: {
      purchase_id: input.purchaseId,
      subscription_id: input.subscriptionId,
      product_code: input.productCode,
      amount_subunits: input.amountSubunits,
      currency: input.currency,
      pricing_tier: input.pricingTier || null,
      pricing_country: input.pricingCountry || null,
    },
  } satisfies NotificationEventInput;
}

export function buildSubscriptionCancelledEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  subscriptionRecordId: string;
  providerSubscriptionId: string;
  planCode: string;
  status: "cancel_scheduled" | "cancelled";
  currentPeriodEnd?: Date | string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("subscription_cancelled", [
      input.subscriptionRecordId,
      input.status,
    ]),
    eventType: "subscription_cancelled",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_subscription",
    }),
    payload: {
      subscription_record_id: input.subscriptionRecordId,
      provider_subscription_id: input.providerSubscriptionId,
      plan_code: input.planCode,
      status: input.status,
      current_period_end: input.currentPeriodEnd
        ? new Date(input.currentPeriodEnd).toISOString()
        : null,
    },
  } satisfies NotificationEventInput;
}

export function buildToolUsageCompletedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  reservationId: string;
  featureCode: string;
  toolCode?: string | null;
  creditsReserved: number;
  processor?: string | null;
  processorJobId?: string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("tool_usage_completed", [input.reservationId]),
    eventType: "tool_usage_completed",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_usage",
      traits: {
        last_feature_code: input.featureCode,
        last_tool_code: input.toolCode || null,
      },
    }),
    payload: {
      reservation_id: input.reservationId,
      feature_code: input.featureCode,
      tool_code: input.toolCode || null,
      credits_reserved: input.creditsReserved,
      processor: input.processor || null,
      processor_job_id: input.processorJobId || null,
    },
  } satisfies NotificationEventInput;
}

export function buildToolUsageHeavyEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  reservationId: string;
  featureCode: string;
  toolCode?: string | null;
  creditsReserved: number;
  thresholdCredits: number;
  processor?: string | null;
  processorJobId?: string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("tool_usage_heavy", [input.reservationId]),
    eventType: "tool_usage_heavy",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_usage",
      traits: {
        last_heavy_feature_code: input.featureCode,
        last_heavy_tool_code: input.toolCode || null,
      },
    }),
    payload: {
      reservation_id: input.reservationId,
      feature_code: input.featureCode,
      tool_code: input.toolCode || null,
      credits_reserved: input.creditsReserved,
      threshold_credits: input.thresholdCredits,
      processor: input.processor || null,
      processor_job_id: input.processorJobId || null,
    },
  } satisfies NotificationEventInput;
}

export function buildToolUsageFailedEvent(input: {
  userId: string;
  email: string;
  name?: string | null;
  reservationId: string;
  featureCode: string;
  toolCode?: string | null;
  creditsReserved: number;
  processor?: string | null;
  processorJobId?: string | null;
  reason?: string | null;
  occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt || new Date();

  return {
    eventId: buildEventId("tool_usage_failed", [
      input.reservationId,
      input.processorJobId || "unknown-job",
    ]),
    eventType: "tool_usage_failed",
    occurredAt,
    profile: buildProfile({
      userId: input.userId,
      email: input.email,
      name: input.name,
      source: "billing_usage",
      traits: {
        last_failed_feature_code: input.featureCode,
        last_failed_tool_code: input.toolCode || null,
      },
    }),
    payload: {
      reservation_id: input.reservationId,
      feature_code: input.featureCode,
      tool_code: input.toolCode || null,
      credits_reserved: input.creditsReserved,
      processor: input.processor || null,
      processor_job_id: input.processorJobId || null,
      reason: input.reason || null,
    },
  } satisfies NotificationEventInput;
}

export async function emitNotificationEvent(input: NotificationEventInput) {
  const config = getNotificationProducerConfig();
  if (!config) {
    return { sent: false, reason: "not_configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.ingestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ingestToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        event_id: input.eventId,
        event_type: input.eventType,
        source: config.source,
        occurred_at: (input.occurredAt || new Date()).toISOString(),
        profile: input.profile,
        payload: input.payload || {},
        traits: input.traits || {},
      }),
    });

    if (!response.ok) {
      console.warn("Notification event ingest rejected", {
        eventId: input.eventId,
        eventType: input.eventType,
        status: response.status,
      });
      return { sent: false, reason: "rejected", status: response.status };
    }

    return { sent: true };
  } catch (error) {
    console.warn("Notification event ingest failed", {
      eventId: input.eventId,
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false, reason: "failed" };
  } finally {
    clearTimeout(timeout);
  }
}
