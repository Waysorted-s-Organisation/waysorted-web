import mongoose, { ClientSession, HydratedDocument } from "mongoose";
import { LIVE_SUBSCRIPTION_STATUSES } from "@/lib/billing/subscription-status";
import { getPlanUi } from "@/app/pricing/pricing-presentation";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import BillingProduct from "@/models/billingProduct";
import CreditLedger, { type ICreditLedger } from "@/models/creditLedger";
import Purchase, { type IPurchase } from "@/models/purchase";
import Refund from "@/models/refund";
import Session from "@/models/session";
import StarterGrant from "@/models/starterGrant";
import type { ISubscription } from "@/models/subscription";
import Subscription from "@/models/subscription";
import UsageReservation from "@/models/usageReservation";
import UserBilling from "@/models/userBilling";
import type { IUserBilling } from "@/models/userBilling";
import User from "@/models/user";
import type { IUser } from "@/types/user";
import {
  BILLING_PRICING_VERSION,
  CATALOG_PRODUCTS,
  getCatalogProduct,
  getVisibleCatalog,
  isSubscriptionActive,
} from "@/lib/billing/catalog";
import { createSignedToken } from "@/lib/billing/crypto";
import { buildStaleReservationFilter } from "@/lib/billing/reservation-sweep";
import { getProcessorCallbackSecret } from "@/lib/billing/env";
import { buildStarterSignalHashes } from "@/lib/billing/request-signals";
import { assertReservationReplayAllowed } from "@/lib/billing/reservation-idempotency";
import { resolveUsageCredits } from "@/lib/billing/usagePricing";
import {
  applyRegionalPrice,
  createPricingContext,
  getCountryTier,
  getCountryFromRequest,
  getCurrencyForCountry,
  getPricingCountryMismatchRiskFlags,
  type PricingContext,
  type RegionalPricedProduct,
  withPricingRiskFlags,
} from "@/lib/billing/regional-pricing";

export type BillingSnapshot = {
  wallet: {
    availableCredits: number;
    heldCredits: number;
    spendableCredits: number;
    lifetimePurchasedCredits: number;
    lifetimeBonusCredits: number;
    lifetimeSpentCredits: number;
    lifetimeRefundedCredits: number;
  };
  subscription: {
    planCode: string | null;
    planName: string | null;
    status: string;
    statusLabel: string;
    description: string;
    startedAt: string | null;
    endsAt: string | null;
    renewsAt: string | null;
    willCancelAt: string | null;
    cancelAtCycleEnd: boolean;
  };
  capabilities: {
    customizablePresets: boolean;
    canPurchaseTopups: boolean;
    canPurchaseStarterPack: boolean;
    /**
     * Premium tool gates, decided HERE rather than in the plugin.
     *
     * The plugin already reads `capabilities.manualFrameSelection` and
     * `capabilities.paletteAi` and falls back to its own hand-written status set
     * when they are absent - which they always were, so the fallback was the
     * only code that ever ran. Four copies of that set existed across the two
     * repos and every one of them had drifted, most recently by omitting
     * "scheduled" and locking out every discounted subscriber for their whole
     * first cycle.
     *
     * Emitting them makes the server the single decider and turns the plugin's
     * copies into dead code that cannot drift again.
     */
    manualFrameSelection: boolean;
    paletteAi: boolean;
    aiContrast: boolean;
  };
  pricingVersion: string;
  pricing: PricingContext;
  catalog: RegionalPricedProduct[];
  billingDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    country: string;
    city: string;
    zipCode: string;
  } | null;
};

type PurchaseDocument = HydratedDocument<IPurchase>;
type SubscriptionDocument = HydratedDocument<ISubscription>;
const LEGACY_STARTER_GRANT_CREDITS = 300;
const SIGNUP_STARTER_GRANT_CREDITS = 100;
const EXISTING_FREE_PLAN_CUTOFF = new Date("2026-05-03T00:00:00.000Z");

function formatBillingPlanName(planCode: string | null, status: string) {
  if (
    !(
      status === "active" ||
      status === "cancel_scheduled" ||
      status === "payment_pending" ||
      // A discounted subscription rests here for its entire first cycle.
      // Returning null showed the customer no plan name at all for 30 days.
      status === "scheduled"
    )
  ) {
    return null;
  }
  // Same source as /pricing, checkout and billing history, rather than a fourth
  // copy of the mapping that can drift from the other three.
  return (planCode ? getPlanUi(planCode)?.planName : null) || "Active";
}

function buildSubscriptionPresentation(input: {
  status: string;
  planCode: string | null;
  renewsAt: Date | null;
  willCancelAt: Date | null;
}) {
  const planName = formatBillingPlanName(input.planCode, input.status);

  if (input.status === "active") {
    return {
      planName,
      statusLabel: "Active",
      description: `${planName || "Subscription"} plan active. Credits and pricing stay synced with your Waysorted account.`,
    };
  }

  if (input.status === "cancel_scheduled") {
    const effectiveDate = input.willCancelAt || input.renewsAt;
    return {
      planName,
      statusLabel: "Cancels at period end",
      description: effectiveDate
        ? `${planName || "Subscription"} stays active until ${effectiveDate.toISOString()}.`
        : `${planName || "Subscription"} cancellation is scheduled for period end.`,
    };
  }

  /**
   * A paid mandate whose first charge is booked ahead.
   *
   * Every discounted subscription rests here for its ENTIRE first cycle: the
   * plan is created full-price with `start_at` one cycle out, and the discount
   * is collected on day 0 as an addon. Without this branch the customer fell
   * through to the default below and was told "Free / Inactive / No active
   * subscription" for thirty days after paying us - and the same status drove
   * whether /billing even offered them a Cancel button.
   */
  if (input.status === "scheduled") {
    return {
      planName,
      statusLabel: "Active",
      description: input.renewsAt
        ? `${planName || "Subscription"} plan active. First full charge on ${input.renewsAt.toISOString()}.`
        : `${planName || "Subscription"} plan active.`,
    };
  }

  if (input.status === "payment_pending") {
    return {
      planName,
      statusLabel: "Payment pending",
      description: "Finish your pending checkout on Waysorted to activate this plan.",
    };
  }

  if (input.status === "halted") {
    return {
      planName,
      statusLabel: "Halted",
      description: "Subscription needs attention before benefits resume.",
    };
  }

  return {
    planName: "Free",
    statusLabel: "Inactive",
    description: "No active subscription. Top up credits or subscribe on Waysorted.",
  };
}

type LedgerInput = {
  userId: string;
  deltaCredits: number;
  balanceAfter?: number | null;
  reason: ICreditLedger["reason"];
  featureCode?: string | null;
  toolCode?: string | null;
  purchaseId?: string | null;
  subscriptionId?: string | null;
  reservationId?: string | null;
  refundId?: string | null;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export async function syncCatalogProducts() {
  await Promise.all(
    CATALOG_PRODUCTS.map((product) =>
      BillingProduct.updateOne(
        { code: product.code },
        {
          $set: {
            ...product,
            version: BILLING_PRICING_VERSION,
          },
        },
        { upsert: true },
      ),
    ),
  );
}

async function runBillingTransaction<T>(work: (session: ClientSession) => Promise<T>) {
  await dbConnect();

  const session = await mongoose.startSession();

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export async function ensureUserBilling(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  session?: ClientSession,
) {
  const openingCredits = typeof user.creditsRemaining === "number" ? user.creditsRemaining : 0;

  /**
   * Two of these can run at once, and the loser used to 500.
   *
   * `user` carries a unique index. When a page fires several billing calls
   * together - the checkout page asks for the snapshot, the current
   * subscription and the profile on mount - concurrent upserts BOTH match
   * nothing and BOTH attempt the insert. Mongo lets one through and rejects the
   * other with E11000, which surfaced as a 500 from whichever endpoint lost:
   * /api/billing/snapshot, /api/billing/subscriptions/current and /api/me all
   * failed intermittently, and checkout cannot render without the snapshot.
   *
   * The loser's row exists by definition - the winner just created it - so the
   * duplicate key is not a failure, it is the answer. Read it back.
   */
  const upsert = async () => UserBilling.findOneAndUpdate(
    { user: user._id },
    {
      $setOnInsert: {
        user: user._id,
        availableCredits: openingCredits,
        heldCredits: 0,
        pricingVersion: BILLING_PRICING_VERSION,
        pricingRiskFlags: [],
        subscriptionStatus: "inactive",
        cancelAtCycleEnd: false,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      includeResultMetadata: true,
      session,
    },
  );

  let upsertResult;
  try {
    upsertResult = await upsert();
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error;
    const existing = await UserBilling.findOne({ user: user._id }).session(session ?? null);
    if (!existing) throw error;
    // The winner seeds the opening ledger entry; the loser must not seed it again.
    return existing;
  }

  const billing = upsertResult.value;
  if (!billing) throw new Error("Unable to initialize billing wallet.");

  const inserted = upsertResult.lastErrorObject?.updatedExisting === false;
  if (inserted && openingCredits > 0) {
    await appendCreditLedger(
      {
        userId: String(user._id),
        deltaCredits: openingCredits,
        balanceAfter: openingCredits,
        reason: "manual_adjustment",
        idempotencyKey: `wallet-seed:${user._id}`,
        metadata: { source: "legacy_user_credit_seed" },
      },
      session,
    ).catch((error) => {
      if ((error as { code?: number }).code !== 11000) throw error;
    });
  }
  return reconcileLegacyBillingState(user, billing, session);
}

async function reconcileLegacyBillingState(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  billing: HydratedDocument<IUserBilling>,
  session?: ClientSession,
) {
  const normalizedBilling = await normalizeLegacyStarterWallet(user, billing, session);
  const dedupedBilling = await reconcileDuplicateStarterWallet(user, normalizedBilling, session);
  return backfillExistingFreePlanWallet(user, dedupedBilling, session);
}

async function normalizeLegacyStarterWallet(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  billing: HydratedDocument<IUserBilling>,
  session?: ClientSession,
) {
  const isLegacyStarterState =
    Boolean(user.earlyAccess) &&
    !billing.firstSuccessfulPurchaseAt &&
    billing.subscriptionStatus === "inactive" &&
    billing.availableCredits > LEGACY_STARTER_GRANT_CREDITS &&
    billing.heldCredits === 0 &&
    billing.lifetimePurchasedCredits === 0 &&
    billing.lifetimeBonusCredits === 0 &&
    billing.lifetimeSpentCredits === 0 &&
    billing.lifetimeRefundedCredits === 0;

  if (!isLegacyStarterState) {
    return billing;
  }

  const previousAvailableCredits = billing.availableCredits;
  billing.availableCredits = LEGACY_STARTER_GRANT_CREDITS;
  billing.lifetimeBonusCredits = LEGACY_STARTER_GRANT_CREDITS;
  await billing.save({ session });

  await updateLegacyUserCredits(String(user._id), billing.availableCredits, session);

  await appendCreditLedger(
    {
      userId: String(user._id),
      deltaCredits: LEGACY_STARTER_GRANT_CREDITS - previousAvailableCredits,
      balanceAfter: billing.availableCredits,
      reason: "manual_adjustment",
      idempotencyKey: `legacy-starter-normalize:${user._id}`,
      metadata: {
        migration: "legacy_early_access_to_starter_grant",
        previousAvailableCredits,
        normalizedAvailableCredits: LEGACY_STARTER_GRANT_CREDITS,
      },
    },
    session,
  );

  return billing;
}

async function reconcileDuplicateStarterWallet(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  billing: HydratedDocument<IUserBilling>,
  session?: ClientSession,
) {
  const starterGrant = await StarterGrant.findOne({ user: user._id })
    .select("grantedCredits")
    .session(session || null);
  const grantedCredits = Number(
    starterGrant?.grantedCredits || LEGACY_STARTER_GRANT_CREDITS,
  );
  const looksLikeDuplicateStarterGrant =
    !billing.firstSuccessfulPurchaseAt &&
    billing.subscriptionStatus === "inactive" &&
    billing.availableCredits === grantedCredits * 2 &&
    billing.heldCredits === 0 &&
    billing.lifetimePurchasedCredits === 0 &&
    billing.lifetimeBonusCredits === grantedCredits * 2 &&
    billing.lifetimeSpentCredits === 0 &&
    billing.lifetimeRefundedCredits === 0;

  if (!looksLikeDuplicateStarterGrant) {
    return billing;
  }

  billing.availableCredits = grantedCredits;
  billing.lifetimeBonusCredits = grantedCredits;
  await billing.save({ session });

  await updateLegacyUserCredits(String(user._id), billing.availableCredits, session);

  await appendCreditLedger(
    {
      userId: String(user._id),
      deltaCredits: -grantedCredits,
      balanceAfter: billing.availableCredits,
      reason: "manual_adjustment",
      idempotencyKey: `starter-grant-dedupe:${user._id}`,
      metadata: {
        migration: "duplicate_starter_grant_reconciled",
        normalizedAvailableCredits: grantedCredits,
      },
    },
    session,
  );

  return billing;
}

async function backfillExistingFreePlanWallet(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  billing: HydratedDocument<IUserBilling>,
  session?: ClientSession,
) {
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const isExistingUser =
    createdAt instanceof Date &&
    !Number.isNaN(createdAt.getTime()) &&
    createdAt.getTime() <= EXISTING_FREE_PLAN_CUTOFF.getTime();

  const isEligibleForFreePlanBackfill =
    isExistingUser &&
    !billing.firstSuccessfulPurchaseAt &&
    billing.subscriptionStatus === "inactive" &&
    billing.heldCredits === 0 &&
    billing.lifetimePurchasedCredits === 0 &&
    billing.lifetimeSpentCredits === 0 &&
    billing.lifetimeRefundedCredits === 0 &&
    (billing.availableCredits < LEGACY_STARTER_GRANT_CREDITS ||
      billing.lifetimeBonusCredits < LEGACY_STARTER_GRANT_CREDITS);

  if (!isEligibleForFreePlanBackfill) {
    return billing;
  }

  const previousAvailableCredits = billing.availableCredits;
  billing.availableCredits = Math.max(billing.availableCredits, LEGACY_STARTER_GRANT_CREDITS);
  billing.lifetimeBonusCredits = Math.max(
    billing.lifetimeBonusCredits,
    LEGACY_STARTER_GRANT_CREDITS,
  );
  await billing.save({ session });

  await updateLegacyUserCredits(String(user._id), billing.availableCredits, session);

  const deltaCredits = billing.availableCredits - previousAvailableCredits;
  if (deltaCredits !== 0) {
    await appendCreditLedger(
      {
        userId: String(user._id),
        deltaCredits,
        balanceAfter: billing.availableCredits,
        reason: "manual_adjustment",
        idempotencyKey: `existing-free-plan-backfill:${user._id}`,
        metadata: {
          migration: "existing_users_free_plan_300",
          previousAvailableCredits,
          normalizedAvailableCredits: billing.availableCredits,
          cutoff: EXISTING_FREE_PLAN_CUTOFF.toISOString(),
        },
      },
      session,
    );
  }

  return billing;
}

function walletAlreadyReflectsStarterGrant(
  billing: HydratedDocument<IUserBilling>,
  minimumCredits = LEGACY_STARTER_GRANT_CREDITS,
) {
  return (
    !billing.firstSuccessfulPurchaseAt &&
    billing.subscriptionStatus === "inactive" &&
    billing.heldCredits === 0 &&
    billing.lifetimePurchasedCredits === 0 &&
    billing.lifetimeSpentCredits === 0 &&
    billing.lifetimeRefundedCredits === 0 &&
    billing.availableCredits >= minimumCredits &&
    billing.lifetimeBonusCredits >= minimumCredits
  );
}

export async function resolveUserPricingContext(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess" | "createdAt">,
  request?: NextRequest | null,
  session?: ClientSession,
  existingBilling?: HydratedDocument<IUserBilling>,
) {
  const billing = existingBilling || await ensureUserBilling(user, session);
  const detectedCountry = getCountryFromRequest(request);
  const recentSession = await Session.findOne({
    user: user._id,
    countryCode: { $exists: true, $ne: null },
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean<{ countryCode?: string | null; pricingTierAtAuth?: string | null } | null>()
    .session(session || null);
  const authCountry = recentSession?.countryCode || null;

  // PRICING IS GEO-BASED ONLY.
  //
  // The price a visitor is shown must not depend on whether they are signed in. Previously this
  // resolved from a persisted per-user lock, which meant /pricing (public, geo) and /billing
  // (authenticated, locked) could quote different amounts for the same plan - the page visibly
  // repainted from the geo price to the locked one as auth resolved. The lock also ratcheted only
  // upward, so a single mis-geolocated request repriced a customer permanently with no way back.
  //
  // The observed country is still recorded below for support and abuse review, but it no longer
  // decides the price.
  const pricingContext = createPricingContext({ detectedCountry });

  // Record what this request was actually priced at. Deliberately NOT getSafestObservedCountry:
  // that returns whichever of (current country, historical session country) has the HIGHER tier,
  // and sessions created before the Cloudflare cutover recorded the proxy PoP country (SG for
  // Indian visitors), so it would keep re-asserting the very value this work removed.
  if (detectedCountry) {
    billing.pricingCountry = detectedCountry;
    billing.pricingTier = getCountryTier(detectedCountry);
    billing.pricingCurrency = getCurrencyForCountry(detectedCountry);
    billing.pricingLockReason = "geo_observation";
    billing.pricingLockedAt = new Date();
  }
  // The upgrade-corroboration state only existed to guard the ratchet, which is gone.
  billing.pricingUpgradeCandidateCountry = null;
  billing.pricingUpgradeCandidateSeenAt = null;

  const riskFlags = [
    ...pricingContext.riskFlags,
    ...getPricingCountryMismatchRiskFlags({
      authCountry,
      trustedRequestCountry: detectedCountry,
      declaredBillingCountry: billing.billingDetails?.country,
      lockedPricingCountry: billing.pricingCountry,
    }),
  ];
  billing.pricingRiskFlags = Array.from(new Set(riskFlags));

  /**
   * Written with updateOne, NOT save(), and that is load-bearing.
   *
   * UserBilling sets `optimisticConcurrency: true` so that credit writes cannot
   * silently clobber each other - that protection must stay. But it applies to
   * every save(), and this function persists a geo OBSERVATION on every read.
   * The checkout page asks for the snapshot, the current subscription and the
   * profile on mount; all three land here, all three save(), and the version
   * check rejected the losers with a VersionError that surfaced as a 500. The
   * result was an intermittently blank checkout - "Unable to load billing
   * snapshot." - on a page where nothing was actually wrong.
   *
   * None of these fields is derived from the document's prior state: they come
   * from this request's country. Last writer wins is the correct semantic, and
   * a concurrent request writing the same observed country writes the same
   * values anyway. Money is untouched here.
   */
  await UserBilling.updateOne(
    { _id: billing._id },
    {
      $set: {
        pricingCountry: billing.pricingCountry,
        pricingTier: billing.pricingTier,
        pricingCurrency: billing.pricingCurrency,
        pricingLockReason: billing.pricingLockReason,
        pricingLockedAt: billing.pricingLockedAt,
        pricingUpgradeCandidateCountry: billing.pricingUpgradeCandidateCountry,
        pricingUpgradeCandidateSeenAt: billing.pricingUpgradeCandidateSeenAt,
        pricingRiskFlags: billing.pricingRiskFlags,
      },
    },
    { session },
  );

  // Geo-only: derived from this request's trusted country, never from the stored record.
  return withPricingRiskFlags(pricingContext, billing.pricingRiskFlags);
}

export async function updateLegacyUserCredits(
  userId: string,
  availableCredits: number,
  session?: ClientSession,
) {
  await User.updateOne({ _id: userId }, { $set: { creditsRemaining: availableCredits } }, { session });
}

export async function appendCreditLedger(input: LedgerInput, session?: ClientSession) {
  const ledger = new CreditLedger({
    user: input.userId,
    deltaCredits: input.deltaCredits,
    balanceAfter: input.balanceAfter ?? null,
    reason: input.reason,
    featureCode: input.featureCode ?? null,
    toolCode: input.toolCode ?? null,
    purchase: input.purchaseId ?? null,
    subscription: input.subscriptionId ?? null,
    reservation: input.reservationId ?? null,
    refund: input.refundId ?? null,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata || {},
  });
  await ledger.save({ session });
  return ledger;
}

export async function buildBillingSnapshot(user: IUser, request?: NextRequest | null): Promise<BillingSnapshot> {
  const billing = await ensureUserBilling(user);
  const pricing = await resolveUserPricingContext(user, request, undefined, billing);
  const hasActiveSubscription = isSubscriptionActive(
    billing.subscriptionStatus,
    billing.subscriptionRenewsAt || billing.subscriptionEndAt || null,
  );
  const isNewUser = !billing.firstSuccessfulPurchaseAt;
  const subscriptionPresentation = buildSubscriptionPresentation({
    status: billing.subscriptionStatus,
    planCode: billing.subscriptionPlanCode || null,
    renewsAt: billing.subscriptionRenewsAt || billing.subscriptionEndAt || null,
    willCancelAt: billing.subscriptionWillCancelAt || null,
  });

  return {
    wallet: {
      availableCredits: billing.availableCredits,
      heldCredits: billing.heldCredits,
      spendableCredits: billing.availableCredits,
      lifetimePurchasedCredits: billing.lifetimePurchasedCredits,
      lifetimeBonusCredits: billing.lifetimeBonusCredits,
      lifetimeSpentCredits: billing.lifetimeSpentCredits,
      lifetimeRefundedCredits: billing.lifetimeRefundedCredits,
    },
    subscription: {
      planCode: billing.subscriptionPlanCode || null,
      planName: subscriptionPresentation.planName,
      status: billing.subscriptionStatus,
      statusLabel: subscriptionPresentation.statusLabel,
      description: subscriptionPresentation.description,
      startedAt: billing.subscriptionStartAt?.toISOString() || null,
      endsAt: billing.subscriptionEndAt?.toISOString() || null,
      renewsAt: billing.subscriptionRenewsAt?.toISOString() || null,
      willCancelAt: billing.subscriptionWillCancelAt?.toISOString() || null,
      cancelAtCycleEnd: billing.cancelAtCycleEnd,
    },
    capabilities: {
      customizablePresets: hasActiveSubscription,
      canPurchaseTopups: true,
      canPurchaseStarterPack: isNewUser,
      // The plugin reads these and only falls back to its own status set when
      // they are missing. They were always missing.
      manualFrameSelection: hasActiveSubscription,
      paletteAi: hasActiveSubscription,
      aiContrast: hasActiveSubscription,
    },
    pricingVersion: billing.pricingVersion,
    pricing,
    catalog: getVisibleCatalog({ isNewUser, hasActiveSubscription }).map((product) =>
      applyRegionalPrice(product, pricing),
    ),
    billingDetails: billing.billingDetails || null,
  };
}

export async function createPurchaseRecord(input: {
  userId: string;
  productCode: string;
  pricedProduct?: RegionalPricedProduct;
  pricing?: PricingContext;
  checkoutSource?: string | null;
  idempotencyKey: string;
  notes?: Record<string, unknown>;
}) {
  const product = getCatalogProduct(input.productCode);
  if (!product) {
    throw new Error("Invalid product code.");
  }

  const pricedProduct = input.pricedProduct || product;
  const receipt = `ws_${product.code}_${Date.now()}_${randomUUID().slice(0, 8)}`;

  return Purchase.create({
    user: input.userId,
    productCode: product.code,
    kind: product.kind,
    status: "created",
    amountPaise: pricedProduct.amountPaise,
    currency: pricedProduct.currency,
    basePriceInr: "basePriceInr" in pricedProduct ? pricedProduct.basePriceInr : product.priceInr,
    pricingCountry: input.pricing?.country || null,
    pricingTier: input.pricing?.tier || null,
    pricingCurrency: input.pricing?.currency || pricedProduct.currency,
    pricingRiskFlags: input.pricing?.riskFlags || [],
    creditsGranted: product.creditsGranted,
    bonusCredits: product.bonusCredits,
    receipt,
    checkoutSource: input.checkoutSource || "website",
    idempotencyKey: input.idempotencyKey,
    notes: input.notes || {},
  });
}

/**
 * Locate the Purchase backing a provider subscription, so a reused checkout can still be verified.
 *
 * /subscriptions/verify requires a purchaseId; without one the customer is charged and then shown
 * "Missing verification fields.", and the confirmation marker the reconciler relies on is never
 * written.
 */
export async function findPurchaseBySubscriptionId(
  userId: string,
  razorpaySubscriptionId?: string | null,
) {
  if (!razorpaySubscriptionId) return null;
  await dbConnect();
  return Purchase.findOne({ user: userId, razorpaySubscriptionId }).sort({ createdAt: -1 });
}

export async function findPurchaseByUserAndIdempotency(userId: string, idempotencyKey: string) {
  return Purchase.findOne({
    user: userId,
    idempotencyKey,
  });
}

export async function findPurchaseByUserAndReference(input: {
  userId: string;
  purchaseId?: string | null;
  razorpayOrderId?: string | null;
}) {
  if (input.purchaseId) {
    return Purchase.findOne({
      _id: input.purchaseId,
      user: input.userId,
    });
  }

  if (input.razorpayOrderId) {
    return Purchase.findOne({
      user: input.userId,
      razorpayOrderId: input.razorpayOrderId,
    });
  }

  return null;
}

export async function applyPurchaseCredits(purchase: PurchaseDocument) {
  return runBillingTransaction(async (session) => {
    const now = new Date();
    const lockedPurchase = await Purchase.findOneAndUpdate(
      {
        _id: purchase._id,
        grantApplied: false,
      },
      {
        $set: {
          grantApplied: true,
          status: "captured",
          capturedAt: purchase.capturedAt || now,
        },
      },
      { new: true, session },
    );

    if (!lockedPurchase) {
      const existingPurchase = await Purchase.findById(purchase._id).session(session);
      if (!existingPurchase) {
        throw new Error("Purchase not found.");
      }
      return existingPurchase;
    }

    const totalGranted = lockedPurchase.creditsGranted + lockedPurchase.bonusCredits;
    const billing = await UserBilling.findOneAndUpdate(
      { user: lockedPurchase.user },
      {
        $inc: {
          availableCredits: totalGranted,
          lifetimePurchasedCredits: lockedPurchase.creditsGranted,
          lifetimeBonusCredits: lockedPurchase.bonusCredits,
        },
      },
      { new: true, session },
    );
    if (!billing) throw new Error("Missing billing wallet.");
    if (!billing.firstSuccessfulPurchaseAt) {
      await UserBilling.updateOne(
        { _id: billing._id, firstSuccessfulPurchaseAt: null },
        { $set: { firstSuccessfulPurchaseAt: now } },
        { session },
      );
      billing.firstSuccessfulPurchaseAt = now;
    }
    const balanceBefore = billing.availableCredits - totalGranted;
    const afterGrant = balanceBefore + lockedPurchase.creditsGranted;
    const afterBonus = billing.availableCredits;

    await updateLegacyUserCredits(String(lockedPurchase.user), billing.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(lockedPurchase.user),
        deltaCredits: lockedPurchase.creditsGranted,
        balanceAfter: afterGrant,
        reason: "purchase_grant",
        purchaseId: String(lockedPurchase._id),
        idempotencyKey: `purchase-grant:${lockedPurchase._id}`,
        metadata: { productCode: lockedPurchase.productCode },
      },
      session,
    );

    if (lockedPurchase.bonusCredits > 0) {
      await appendCreditLedger(
        {
          userId: String(lockedPurchase.user),
          deltaCredits: lockedPurchase.bonusCredits,
          balanceAfter: afterBonus,
          reason: "bonus_grant",
          purchaseId: String(lockedPurchase._id),
          idempotencyKey: `purchase-bonus:${lockedPurchase._id}`,
          metadata: { productCode: lockedPurchase.productCode },
        },
        session,
      );
    }

    return lockedPurchase;
  });
}

/**
 * Free the unique `one_live_subscription_per_user` slot held by an unpayable pending subscription.
 *
 * That partial index covers `payment_pending`, so a stale pending row makes every subsequent
 * subscription attempt fail with E11000 - and the failure happens only AFTER a live, customer-payable
 * Razorpay subscription has been created, so each retry leaks one. Moving the row to `expired` takes
 * it out of the index and lets the customer pay again.
 */
export async function releaseSupersededPendingSubscription(
  subscriptionId: string,
  expectedStatus: string = "payment_pending",
) {
  await dbConnect();
  // Conditional on the status we observed, so two concurrent checkouts cannot both claim the row.
  // A null result means someone else won; the caller must not proceed to create a provider
  // subscription, or it would be orphaned and payable.
  return Subscription.findOneAndUpdate(
    { _id: subscriptionId, status: expectedStatus },
    {
      $set: {
        status: "expired",
        cancelAtCycleEnd: false,
        supersededAt: new Date(),
      },
    },
    { new: true },
  );
}

/**
 * Flag a released subscription whose provider-side cancellation failed.
 *
 * The local row is already out of the way so checkout can continue, but the provider subscription
 * is still live and could charge the customer. Recording it lets the reconciler retry the cancel
 * instead of leaving an untracked, payable subscription behind.
 */
export async function markSubscriptionCancellationPending(subscriptionId: string) {
  await dbConnect();
  return Subscription.updateOne(
    { _id: subscriptionId },
    { $set: { providerCancellationPending: true } },
  );
}

export async function ensureSubscriptionRecord(input: {
  userId: string;
  planCode: string;
  providerPlanId: string;
  providerSubscriptionId: string;
  pricing?: PricingContext | null;
  amountSubunits?: number | null;
  basePriceInr?: number | null;
  metadata?: Record<string, unknown>;
  session?: ClientSession;
}) {
  if (!input.userId) {
    throw new Error("Missing userId for subscription record.");
  }
  if (!input.planCode) {
    throw new Error("Missing planCode for subscription record.");
  }

  const existing = await Subscription.findOne({
    providerSubscriptionId: input.providerSubscriptionId,
  }).session(input.session || null);
  if (existing) return existing;

  const subscription = new Subscription({
    user: input.userId,
    planCode: input.planCode,
    status: "payment_pending",
    providerPlanId: input.providerPlanId,
    providerSubscriptionId: input.providerSubscriptionId,
    pricingCountry: input.pricing?.country || null,
    pricingTier: input.pricing?.tier || null,
    pricingCurrency: input.pricing?.currency || null,
    amountSubunits: input.amountSubunits ?? null,
    basePriceInr: input.basePriceInr ?? null,
    metadata: input.metadata || {},
  });
  await subscription.save({ session: input.session });
  return subscription;
}

export async function updateBillingSubscriptionState(input: {
  userId: string;
  planCode?: string | null;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  renewsAt?: Date | null;
  cancelAtCycleEnd?: boolean;
  session?: ClientSession;
}) {
  const updates: Record<string, unknown> = {
    subscriptionStatus: input.status,
    subscriptionWillCancelAt:
      input.cancelAtCycleEnd && input.currentPeriodEnd ? input.currentPeriodEnd : null,
  };
  if (input.planCode !== undefined) updates.subscriptionPlanCode = input.planCode;
  if (input.currentPeriodStart !== undefined) updates.subscriptionStartAt = input.currentPeriodStart;
  if (input.currentPeriodEnd !== undefined) updates.subscriptionEndAt = input.currentPeriodEnd;
  if (input.renewsAt !== undefined) updates.subscriptionRenewsAt = input.renewsAt;
  if (input.cancelAtCycleEnd !== undefined) updates.cancelAtCycleEnd = input.cancelAtCycleEnd;
  // Upsert rather than require an existing wallet. A user can reach a subscription state change
  // without ever having had a wallet created - the row is written lazily on first billing activity -
  // and throwing here made the webhook 500. Razorpay then retried until it gave up, so the
  // cancellation was never recorded locally and the customer kept entitlements they had stopped
  // paying for. Observed in production as five permanently-failed subscription.cancelled events.
  // Seed the opening balance the same way ensureUserBilling does. Hardcoding 0 here would
  // permanently destroy a legacy user's credits: they carry the balance on user.creditsRemaining
  // until their wallet is first created, and $setOnInsert never fires again once a row exists - so
  // a subscription webhook arriving before their first billing page visit would zero them out.
  const legacyUser = await User.findById(input.userId)
    .select("creditsRemaining")
    .lean<{ creditsRemaining?: number } | null>();
  const openingCredits =
    typeof legacyUser?.creditsRemaining === "number" ? legacyUser.creditsRemaining : 0;

  const billing = await UserBilling.findOneAndUpdate(
    { user: input.userId },
    {
      $set: updates,
      $setOnInsert: {
        user: input.userId,
        availableCredits: openingCredits,
        heldCredits: 0,
        pricingVersion: BILLING_PRICING_VERSION,
        pricingRiskFlags: [],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, session: input.session },
  );
  if (!billing) throw new Error("Missing billing wallet.");
  return billing;
}

export async function findSubscriptionByProviderId(providerSubscriptionId: string) {
  await dbConnect();
  return Subscription.findOne({ providerSubscriptionId });
}

export async function applySubscriptionCycleCredits(input: {
  subscription: SubscriptionDocument;
  cycleKey: string;
  paymentId?: string | null;
}) {
  return runBillingTransaction(async (session) => {
    const product = getCatalogProduct(input.subscription.planCode);
    if (!product) {
      throw new Error("Unknown subscription plan.");
    }

    const existingSubscription = await Subscription.findById(input.subscription._id).session(session);
    if (!existingSubscription) throw new Error("Subscription not found.");
    const ledgerKey = `subscription-cycle:${existingSubscription._id}:${input.cycleKey}`;
    const totalGranted = product.creditsGranted + product.bonusCredits;

    try {
      await CreditLedger.create([{
        user: existingSubscription.user,
        deltaCredits: totalGranted,
        balanceAfter: null,
        reason: "subscription_cycle_grant",
        subscription: existingSubscription._id,
        idempotencyKey: ledgerKey,
        metadata: {
          cycleKey: input.cycleKey,
          paymentId: input.paymentId || null,
          planCode: existingSubscription.planCode,
          purchasedCredits: product.creditsGranted,
          bonusCredits: product.bonusCredits,
        },
      }], { session });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return existingSubscription;
      throw error;
    }

    const lockedSubscription = await Subscription.findByIdAndUpdate(
      existingSubscription._id,
      { $set: {
        lastCreditsGrantCycleKey: input.cycleKey,
        lastCreditsGrantedAt: new Date(),
        lastPaymentId: input.paymentId || null,
      } },
      { new: true, session },
    );
    if (!lockedSubscription) throw new Error("Subscription not found.");

    const billing = await UserBilling.findOneAndUpdate(
      { user: lockedSubscription.user },
      {
        $inc: {
          availableCredits: totalGranted,
          lifetimePurchasedCredits: product.creditsGranted,
          lifetimeBonusCredits: product.bonusCredits,
        },
        $set: {
          subscriptionStatus: lockedSubscription.status === "cancel_scheduled" ? "cancel_scheduled" : "active",
          subscriptionPlanCode: lockedSubscription.planCode,
          subscriptionRenewsAt: lockedSubscription.nextChargeAt || lockedSubscription.currentPeriodEnd || null,
          subscriptionEndAt: lockedSubscription.currentPeriodEnd || null,
        },
      },
      { new: true, session },
    );
    if (!billing) throw new Error("Missing billing wallet.");

    await updateLegacyUserCredits(String(lockedSubscription.user), billing.availableCredits, session);

    await CreditLedger.updateOne(
      { idempotencyKey: ledgerKey },
      { $set: { balanceAfter: billing.availableCredits } },
      { session },
    );

    return lockedSubscription;
  });
}

export async function reserveCredits(input: {
  userId: string;
  featureCode: string;
  toolCode?: string | null;
  sizeBucket?: string | null;
  creditsRequired: number;
  processor?: string | null;
  selectedOptions?: Record<string, unknown>;
  idempotencyKey: string;
  ttlMinutes?: number;
}) {
  return runBillingTransaction(async (session) => {
    const existing = await UsageReservation.findOne({
      user: input.userId,
      idempotencyKey: input.idempotencyKey,
    }).session(session);
    if (existing) {
      assertReservationReplayAllowed(existing, input);
      const billing = await UserBilling.findOne({ user: input.userId })
        .select("availableCredits")
        .session(session);
      return {
        reservation: existing,
        balanceAfterAction: Number(billing?.availableCredits ?? 0),
      };
    }

    const billing = await UserBilling.findOneAndUpdate(
      {
        user: input.userId,
        availableCredits: { $gte: input.creditsRequired },
      },
      {
        $inc: {
          availableCredits: -input.creditsRequired,
          heldCredits: input.creditsRequired,
        },
      },
      { new: true, session },
    );

    if (!billing) {
      const error = new Error("Insufficient credits.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    await updateLegacyUserCredits(input.userId, billing.availableCredits, session);

    const expiresAt = new Date(Date.now() + (input.ttlMinutes ?? 20) * 60_000);
    const reservation = new UsageReservation({
      user: input.userId,
      featureCode: input.featureCode,
      toolCode: input.toolCode || null,
      sizeBucket: input.sizeBucket || null,
      creditsReserved: input.creditsRequired,
      status: "reserved",
      idempotencyKey: input.idempotencyKey,
      processor: input.processor || null,
      processorToken: null,
      selectedOptions: input.selectedOptions || {},
      expiresAt,
    });
    await reservation.save({ session });

    const processorToken = createSignedToken(
      {
        userId: input.userId,
        reservationId: String(reservation._id),
        featureCode: input.featureCode,
        toolCode: input.toolCode || null,
        processor: input.processor || null,
        creditsRequired: input.creditsRequired,
        expiresAt: expiresAt.toISOString(),
        idempotencyKey: input.idempotencyKey,
      },
      getProcessorCallbackSecret(),
    );

    reservation.processorToken = processorToken;
    await reservation.save({ session });

    await appendCreditLedger(
      {
        userId: input.userId,
        deltaCredits: 0,
        balanceAfter: billing.availableCredits + billing.heldCredits,
        reason: "reservation_hold",
        featureCode: input.featureCode,
        toolCode: input.toolCode || null,
        reservationId: String(reservation._id),
        idempotencyKey: `reservation-hold:${reservation._id}`,
        metadata: { expiresAt: expiresAt.toISOString() },
      },
      session,
    );

    return {
      reservation,
      balanceAfterAction: Number(billing.availableCredits),
    };
  });
}

export async function commitReservation(input: {
  userId: string;
  reservationId?: string | null;
  idempotencyKey?: string | null;
  processorJobId?: string | null;
}) {
  return runBillingTransaction(async (session) => {
    const reservationQuery = input.reservationId
      ? { _id: input.reservationId, user: input.userId }
      : input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey, user: input.userId }
        : null;

    if (!reservationQuery) {
      const error = new Error("Missing reservation identifier.");
      (error as Error & { status?: number }).status = 400;
      throw error;
    }

    const existingReservation = await UsageReservation.findOne(reservationQuery).session(session);
    if (!existingReservation) {
      const error = new Error("Reservation not found.");
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    if (
      existingReservation.featureCode.startsWith("import_") &&
      existingReservation.metadata?.authoritativePricingApplied !== true
    ) {
      const error = new Error("Import pricing has not been verified by the processor.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    if (existingReservation.status === "committed") return existingReservation;
    if (existingReservation.status === "expired") {
      const billing = await UserBilling.findOneAndUpdate(
        {
          user: existingReservation.user,
          availableCredits: { $gte: existingReservation.creditsReserved },
        },
        {
          $inc: {
            availableCredits: -existingReservation.creditsReserved,
            lifetimeSpentCredits: existingReservation.creditsReserved,
          },
        },
        { new: true, session },
      );
      if (!billing) {
        const error = new Error("Insufficient credits to settle completed work.");
        (error as Error & { status?: number }).status = 409;
        throw error;
      }

      const committed = await UsageReservation.findOneAndUpdate(
        { ...reservationQuery, status: "expired" },
        { $set: {
          status: "committed",
          committedAt: new Date(),
          processorJobId: input.processorJobId || existingReservation.processorJobId || null,
          "metadata.settledAfterExpiry": true,
        } },
        { new: true, session },
      );
      if (!committed) return existingReservation;

      await updateLegacyUserCredits(String(committed.user), billing.availableCredits, session);
      await appendCreditLedger({
        userId: String(committed.user),
        deltaCredits: -committed.creditsReserved,
        balanceAfter: billing.availableCredits,
        reason: "reservation_commit",
        featureCode: committed.featureCode,
        toolCode: committed.toolCode,
        reservationId: String(committed._id),
        idempotencyKey: `reservation-commit:${committed._id}`,
        metadata: { processorJobId: input.processorJobId || null, settledAfterExpiry: true },
      }, session);
      return committed;
    }
    if (existingReservation.status !== "reserved") {
      const error = new Error(`Cannot commit reservation in status ${existingReservation.status}.`);
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    const reservation = await UsageReservation.findOneAndUpdate(
      { ...reservationQuery, status: "reserved" },
      {
        $set: {
          status: "committed",
          committedAt: new Date(),
          processorJobId: input.processorJobId || existingReservation.processorJobId || null,
        },
      },
      { new: true, session },
    );

    if (!reservation) {
      return existingReservation;
    }

    const billing = await UserBilling.findOneAndUpdate(
      {
        user: reservation.user,
        heldCredits: { $gte: reservation.creditsReserved },
      },
      {
        $inc: {
          heldCredits: -reservation.creditsReserved,
          lifetimeSpentCredits: reservation.creditsReserved,
        },
      },
      { new: true, session },
    );
    if (!billing) throw new Error("Missing billing wallet.");

    await updateLegacyUserCredits(String(reservation.user), billing.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(reservation.user),
        deltaCredits: -reservation.creditsReserved,
        balanceAfter: billing.availableCredits + billing.heldCredits,
        reason: "reservation_commit",
        featureCode: reservation.featureCode,
        toolCode: reservation.toolCode,
        reservationId: String(reservation._id),
        idempotencyKey: `reservation-commit:${reservation._id}`,
        metadata: { processorJobId: input.processorJobId || null },
      },
      session,
    );

    return reservation;
  });
}

export async function settleImportReservationPricing(input: {
  userId: string;
  reservationId: string;
  actualSizeBytes: number;
  importMode?: string | null;
}) {
  if (!Number.isSafeInteger(input.actualSizeBytes) || input.actualSizeBytes <= 0) {
    const error = new Error("Processor reported an invalid file size.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  return runBillingTransaction(async (session) => {
    const reservation = await UsageReservation.findOne({
      _id: input.reservationId,
      user: input.userId,
      status: "reserved",
    }).session(session);
    if (!reservation) throw new Error("Reservation not found or no longer adjustable.");
    if (reservation.metadata?.authoritativePricingApplied === true) return reservation;
    if (!reservation.toolCode || !reservation.featureCode.startsWith("import_")) {
      throw new Error("Reservation is not an import job.");
    }

    const resolved = resolveUsageCredits({
      featureCode: "import_file",
      toolCode: reservation.toolCode,
      sizeBytes: input.actualSizeBytes,
      selectedOptions: {
        ...(reservation.selectedOptions || {}),
        ...(input.importMode ? { importMode: input.importMode } : {}),
      },
    });
    // resolveUsageCredits deliberately returns the maximum hold. Resolve the
    // authoritative tier directly using the stored table through its declared
    // size marker, then derive the actual cost from that tier.
    const { resolveImportPricing } = await import("@/lib/billing/catalog");
    const actualRule = resolveImportPricing(
      reservation.toolCode,
      input.actualSizeBytes,
      input.importMode ? { importMode: input.importMode } : reservation.selectedOptions || {},
    );
    if (!actualRule) {
      const error = new Error("Processor file exceeds the supported import size.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }
    const actualCredits = actualRule.credits * 2;
    if (actualCredits > reservation.creditsReserved || resolved.creditsRequired < actualCredits) {
      throw new Error("Authoritative import price exceeds the reserved hold.");
    }
    const releaseCredits = reservation.creditsReserved - actualCredits;
    if (releaseCredits > 0) {
      const billing = await UserBilling.findOneAndUpdate(
        { user: reservation.user, heldCredits: { $gte: releaseCredits } },
        { $inc: { heldCredits: -releaseCredits, availableCredits: releaseCredits } },
        { new: true, session },
      );
      if (!billing) throw new Error("Unable to settle import credit hold.");
      await updateLegacyUserCredits(String(reservation.user), billing.availableCredits, session);
      await appendCreditLedger({
        userId: String(reservation.user),
        deltaCredits: 0,
        balanceAfter: billing.availableCredits + billing.heldCredits,
        reason: "reservation_release",
        featureCode: reservation.featureCode,
        toolCode: reservation.toolCode,
        reservationId: String(reservation._id),
        idempotencyKey: `reservation-price-settlement:${reservation._id}`,
        metadata: { releaseCredits, actualSizeBytes: input.actualSizeBytes, actualSizeBucket: actualRule.sizeLabel },
      }, session);
    }
    reservation.creditsReserved = actualCredits;
    reservation.sizeBucket = actualRule.sizeLabel;
    reservation.metadata = {
      ...(reservation.metadata || {}),
      authoritativePricingApplied: true,
      actualSizeBytes: input.actualSizeBytes,
      actualImportMode: input.importMode || null,
    };
    await reservation.save({ session });
    return reservation;
  });
}

export async function releaseReservation(input: {
  userId: string;
  reservationId?: string | null;
  idempotencyKey?: string | null;
  reason?: string | null;
  compensateCommitted?: boolean;
  /**
   * Who is releasing. "user" is a customer-initiated cancel and must not be able to free a hold the
   * processor has already accepted - that would deliver the work and destroy the only record that
   * it should be billed. "system" is the expiry sweeper and the processor callback.
   */
  actor?: "user" | "system";
}) {
  return runBillingTransaction(async (session) => {
    const reservationQuery = input.reservationId
      ? { _id: input.reservationId, user: input.userId }
      : input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey, user: input.userId }
        : null;

    if (!reservationQuery) {
      const error = new Error("Missing reservation identifier.");
      (error as Error & { status?: number }).status = 400;
      throw error;
    }

    const existingReservation = await UsageReservation.findOne(reservationQuery).session(session);
    if (!existingReservation) {
      const error = new Error("Reservation not found.");
      (error as Error & { status?: number }).status = 404;
      throw error;
    }

    if (["released", "expired", "compensated"].includes(existingReservation.status)) {
      return existingReservation;
    }

    // A customer cannot release a hold the processor has already picked up: the job is in flight,
    // so releasing it returns the credits while the work still gets delivered, and the later
    // completion callback has nothing left to charge against.
    // Read the monotonic acceptance marker, never the mutable status field: a client-authenticated
    // route (usage/plugin-status) can write processorStatus, so guarding on it let a user downgrade
    // their own in-flight job to "failed" and then release the hold - delivered work, no charge.
    const reservationMetadata = (existingReservation.metadata || {}) as Record<string, unknown>;
    const processorHasAccepted =
      Boolean(reservationMetadata.processorAcceptedAt) ||
      reservationMetadata.processorStatus === "accepted";
    if (input.actor === "user" && processorHasAccepted) {
      const error = new Error("This job is already being processed and cannot be cancelled.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }

    if (existingReservation.status === "reserved") {
      const reservation = await UsageReservation.findOneAndUpdate(
        { ...reservationQuery, status: "reserved" },
        {
          $set: {
            status: input.reason === "expired" ? "expired" : "released",
            releasedAt: new Date(),
          },
        },
        { new: true, session },
      );

      if (!reservation) return existingReservation;

      const billing = await UserBilling.findOneAndUpdate(
        {
          user: reservation.user,
          heldCredits: { $gte: reservation.creditsReserved },
        },
        {
          $inc: {
            heldCredits: -reservation.creditsReserved,
            availableCredits: reservation.creditsReserved,
          },
        },
        { new: true, session },
      );
      if (!billing) throw new Error("Missing billing wallet.");

      await updateLegacyUserCredits(String(reservation.user), billing.availableCredits, session);

      await appendCreditLedger(
        {
          userId: String(reservation.user),
          deltaCredits: 0,
          balanceAfter: billing.availableCredits + billing.heldCredits,
          reason: "reservation_release",
          featureCode: reservation.featureCode,
          toolCode: reservation.toolCode,
          reservationId: String(reservation._id),
          idempotencyKey: `reservation-release:${reservation._id}`,
          metadata: { reason: input.reason || null },
        },
        session,
      );

      return reservation;
    }

    if (existingReservation.status === "committed" && input.compensateCommitted) {
      const reservation = await UsageReservation.findOneAndUpdate(
        { ...reservationQuery, status: "committed" },
        {
          $set: {
            status: "compensated",
            releasedAt: new Date(),
          },
        },
        { new: true, session },
      );

      if (!reservation) return existingReservation;

      const billing = await UserBilling.findOneAndUpdate(
        {
          user: reservation.user,
          lifetimeSpentCredits: { $gte: reservation.creditsReserved },
        },
        {
          $inc: {
            availableCredits: reservation.creditsReserved,
            lifetimeSpentCredits: -reservation.creditsReserved,
          },
        },
        { new: true, session },
      );
      if (!billing) throw new Error("Missing billing wallet.");

      await updateLegacyUserCredits(String(reservation.user), billing.availableCredits, session);

      await appendCreditLedger(
        {
          userId: String(reservation.user),
          deltaCredits: reservation.creditsReserved,
          balanceAfter: billing.availableCredits,
          reason: "compensation_credit",
          featureCode: reservation.featureCode,
          toolCode: reservation.toolCode,
          reservationId: String(reservation._id),
          idempotencyKey: `reservation-compensation:${reservation._id}`,
          metadata: { reason: input.reason || null },
        },
        session,
      );

      return reservation;
    }

    const error = new Error(`Cannot release reservation in status ${existingReservation.status}.`);
    (error as Error & { status?: number }).status = 409;
    throw error;
  });
}

export async function expireStaleReservations(input: {
  userId?: string | null;
  limit?: number;
} = {}) {
  // Callers are background jobs with no ambient connection; `bufferCommands: false` makes every
  // model call throw immediately without this.
  await dbConnect();
  const limit = Math.max(1, Math.min(input.limit ?? 50, 200));
  const now = new Date();
  const staleReservations = await UsageReservation.find(
    buildStaleReservationFilter({ now, userId: input.userId }),
  ).sort({ expiresAt: 1 }).limit(limit);

  const summary = { scanned: staleReservations.length, released: 0, failed: 0 };

  for (const reservation of staleReservations) {
    // Isolate per reservation: without this, one bad document aborts the whole batch and every
    // remaining customer's credits stay stranded until the next run - silently.
    try {
      await releaseReservation({
        userId: String(reservation.user),
        reservationId: String(reservation._id),
        reason: "expired",
        actor: "system",
      });
      summary.released += 1;
    } catch (error) {
      summary.failed += 1;
      console.error("Failed to expire stale reservation", {
        reservationId: String(reservation._id),
        user: String(reservation.user),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}

export async function recordProcessorReservationStatus(input: {
  userId: string;
  reservationId: string;
  processor?: string | null;
  processorJobId?: string | null;
  status: "accepted" | "completed" | "failed";
  reason?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * Where this report came from. "plugin" is an ordinary session-authenticated client, so it must
   * never be able to clear an acceptance recorded by the HMAC-verified processor callback -
   * otherwise a user can downgrade their own in-flight job to "failed", release the hold, and
   * receive the delivered work for free.
   */
  origin?: "plugin" | "processor";
}) {
  const reservation = await UsageReservation.findOne({
    _id: input.reservationId,
    user: input.userId,
  });

  if (!reservation) {
    const error = new Error("Reservation not found.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  if (
    ["committed", "compensated"].includes(reservation.status) &&
    input.status === "accepted"
  ) {
    const error = new Error("A completed reservation cannot return to accepted status.");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }

  const existingMetadata = (reservation.metadata || {}) as Record<string, unknown>;
  const alreadyAccepted =
    existingMetadata.processorStatus === "accepted" || Boolean(existingMetadata.processorAcceptedAt);

  // A plugin report may not clear an acceptance. Keep its claim in a separate field so the
  // authorization decision never reads a value the client controls.
  if (input.origin === "plugin" && alreadyAccepted && input.status !== "accepted") {
    reservation.metadata = {
      ...existingMetadata,
      client: { ...(input.metadata || {}) },
      pluginReportedStatus: input.status,
      pluginReportedReason: input.reason || null,
      pluginReportedAt: new Date().toISOString(),
    };
    reservation.markModified("metadata");
    await reservation.save();
    return reservation;
  }

  reservation.metadata = {
    ...existingMetadata,
    client: { ...(input.metadata || {}) },
    processorStatus: input.status,
    processorReason: input.reason || null,
    processorUpdatedAt: new Date().toISOString(),
    // Monotonic: once the processor has accepted, this is never cleared, so the release guard
    // cannot be defeated by any later status write.
    processorAcceptedAt:
      input.status === "accepted"
        ? existingMetadata.processorAcceptedAt || new Date().toISOString()
        : existingMetadata.processorAcceptedAt || null,
  };

  if (input.status === "accepted") {
    reservation.expiresAt = new Date(Date.now() + 20 * 60_000);
  }

  if (input.processor) {
    reservation.processor = input.processor;
  }

  if (input.processorJobId) {
    reservation.processorJobId = input.processorJobId;
  }

  await reservation.save();
  return reservation;
}

export async function findCurrentSubscription(userId: string) {
  return Subscription.findOne({
    user: userId,
    // MUST match the one_live_subscription_per_user partial index in models/subscription.ts. If a
    // live status is missing here, the create route cannot see the existing subscription, proceeds
    // to make a second one, and the unique index rejects the insert with an opaque E11000 - after a
    // payable provider subscription has already been created and leaked.
    status: { $in: [...LIVE_SUBSCRIPTION_STATUSES] },
  }).sort({ updatedAt: -1 });
}

export async function recordRefundAdjustment(input: {
  purchase: PurchaseDocument;
  amountPaise: number;
  refundId: string;
}) {
  return runBillingTransaction(async (session) => {
    const purchase = await Purchase.findById(input.purchase._id).session(session);
    if (!purchase) {
      throw new Error("Purchase not found.");
    }

    const billing = await UserBilling.findOne({ user: purchase.user }).session(session);
    if (!billing) throw new Error("Missing billing wallet.");

    const totalCredits = purchase.creditsGranted + purchase.bonusCredits;
    const cumulativeRefundAmount = Math.min(
      purchase.amountPaise,
      (purchase.refundedAmountPaise || 0) + Math.max(input.amountPaise, 0),
    );
    const targetCreditsToReverse = Math.min(
      totalCredits,
      Math.floor((totalCredits * cumulativeRefundAmount) / purchase.amountPaise),
    );
    const deltaCreditsToReverse = Math.max(0, targetCreditsToReverse - (purchase.refundedCreditsApplied || 0));

    purchase.refundedAmountPaise = cumulativeRefundAmount;
    // Reversed against available AND held credits.
    //
    // Held credits are the customer's, merely reserved by in-flight work, and
    // ignoring them made the clawback silently do nothing: a wallet at
    // available 0 / held 150 reversed 0 credits while both callers set
    // creditAdjustmentApplied unconditionally, so nothing ever retried. The
    // hold then returned to spendable within a day and the customer kept
    // credits for a refunded purchase. One production wallet sits at
    // available 0 / held 300 right now.
    const reversibleCredits =
      Math.max(0, Number(billing.availableCredits)) + Math.max(0, Number(billing.heldCredits || 0));
    const appliedCredits = Math.min(deltaCreditsToReverse, reversibleCredits);
    const clawbackShortfallCredits = deltaCreditsToReverse - appliedCredits;
    if (clawbackShortfallCredits > 0) {
      // Surfaced rather than swallowed: the caller marks the adjustment applied
      // regardless, so a silent shortfall is a permanent under-reversal.
      console.error("[billing] refund clawback could not reverse the full amount", {
        purchaseId: String(purchase._id),
        userId: String(purchase.user),
        wanted: deltaCreditsToReverse,
        reversed: appliedCredits,
        shortfall: clawbackShortfallCredits,
      });
    }
    purchase.refundedCreditsApplied = (purchase.refundedCreditsApplied || 0) + appliedCredits;
    await purchase.save({ session });

    if (deltaCreditsToReverse === 0) {
      return purchase;
    }

    // Take from available first, then from held. The condition guards the
    // combined balance, so a reversal is never applied against a wallet that
    // cannot cover it.
    const fromAvailable = Math.min(appliedCredits, Math.max(0, Number(billing.availableCredits)));
    const fromHeld = appliedCredits - fromAvailable;
    const updatedBilling = await UserBilling.findOneAndUpdate(
      {
        user: purchase.user,
        availableCredits: { $gte: fromAvailable },
        ...(fromHeld > 0 ? { heldCredits: { $gte: fromHeld } } : {}),
      },
      {
        $inc: {
          availableCredits: -fromAvailable,
          ...(fromHeld > 0 ? { heldCredits: -fromHeld } : {}),
          lifetimeRefundedCredits: appliedCredits,
        },
      },
      { new: true, session },
    );
    if (!updatedBilling) throw new Error("Unable to apply refund credit adjustment.");
    await updateLegacyUserCredits(String(purchase.user), updatedBilling.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(purchase.user),
        deltaCredits: -appliedCredits,
        balanceAfter: updatedBilling.availableCredits,
        reason: "refund_debit",
        purchaseId: String(purchase._id),
        refundId: input.refundId,
        idempotencyKey: `refund-debit:${input.refundId}`,
        metadata: {
          amountPaise: input.amountPaise,
          productCode: purchase.productCode,
          cumulativeRefundAmount,
          requestedCreditReversal: deltaCreditsToReverse,
          appliedCredits,
          clawbackShortfallCredits,
        },
      },
      session,
    );

    return purchase;
  });
}

export async function createRefundRecord(input: {
  purchase: PurchaseDocument;
  amountPaise: number;
  paymentId: string;
  providerRefundId?: string | null;
  initiatedBy?: string | null;
  reason?: string | null;
}) {
  if (input.providerRefundId) {
    const existing = await Refund.findOne({ providerRefundId: input.providerRefundId });
    if (existing) return existing;
  }

  return Refund.create({
    user: input.purchase.user,
    purchase: input.purchase._id,
    paymentId: input.paymentId,
    providerRefundId: input.providerRefundId || null,
    amountPaise: input.amountPaise,
    status: input.providerRefundId ? "processed" : "created",
    reason: input.reason || null,
    initiatedBy: input.initiatedBy || null,
    creditAdjustmentApplied: false,
  });
}

export async function ensureStarterGrant(input: {
  user: Pick<IUser, "_id" | "email" | "creditsRemaining" | "earlyAccess" | "createdAt">;
  source?: string | null;
  googleSub?: string | null;
  ipPrefix?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}) {
  return runBillingTransaction(async (session) => {
    const isPluginSource = input.source === "figma" || input.source === "plugin";
    if (!isPluginSource) return null;

    const existing = await StarterGrant.findOne({ user: input.user._id }).session(session);
    if (existing) return existing;

    const hashes = buildStarterSignalHashes({
      email: input.user.email,
      googleSub: input.googleSub || null,
      ipPrefix: input.ipPrefix || null,
      userAgent: input.userAgent || null,
      deviceId: input.deviceId || null,
    });

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [deviceMatches, ipMatches, ipUserAgentMatches] = await Promise.all([
      hashes.deviceFingerprintHash
        ? StarterGrant.countDocuments({
            deviceFingerprintHash: hashes.deviceFingerprintHash,
            status: "granted",
          }).session(session)
        : Promise.resolve(0),
      hashes.ipPrefixHash
        ? StarterGrant.countDocuments({
            ipPrefixHash: hashes.ipPrefixHash,
            status: "granted",
            createdAt: { $gte: last24Hours },
          }).session(session)
        : Promise.resolve(0),
      hashes.ipPrefixHash && hashes.userAgentHash
        ? StarterGrant.countDocuments({
            ipPrefixHash: hashes.ipPrefixHash,
            userAgentHash: hashes.userAgentHash,
            status: "granted",
            createdAt: { $gte: last24Hours },
          }).session(session)
        : Promise.resolve(0),
    ]);

    let riskScore = 0;
    const reasons: string[] = [];

    if (deviceMatches > 0) {
      riskScore += 90;
      reasons.push("device_reuse");
    }

    if (ipMatches >= 3) {
      riskScore += 50;
      reasons.push("high_ip_velocity");
    } else if (ipMatches >= 1) {
      riskScore += 20;
      reasons.push("shared_ip_prefix");
    }

    if (ipUserAgentMatches >= 2) {
      riskScore += 35;
      reasons.push("shared_ip_user_agent");
    }

    if (!hashes.deviceFingerprintHash && input.source === "plugin") {
      riskScore += 10;
      reasons.push("missing_plugin_device_id");
    }

    const status =
      riskScore >= 80 ? "blocked" : riskScore >= 45 ? "review_pending" : "granted";

    const grant = new StarterGrant({
      user: input.user._id,
      grantedCredits: SIGNUP_STARTER_GRANT_CREDITS,
      status,
      riskScore,
      decisionReason: reasons.join(",") || "starter_grant_allowed",
      emailHash: hashes.emailHash,
      googleSubHash: hashes.googleSubHash,
      ipPrefixHash: hashes.ipPrefixHash,
      userAgentHash: hashes.userAgentHash,
      deviceFingerprintHash: hashes.deviceFingerprintHash,
      source: input.source || null,
      grantedAt: status === "granted" ? new Date() : null,
      blockedAt: status === "blocked" ? new Date() : null,
      reviewedAt: status === "review_pending" ? new Date() : null,
      notes: {
        ipMatches,
        ipUserAgentMatches,
        deviceMatches,
      },
    });

    try {
      await grant.save({ session });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return StarterGrant.findOne({ user: input.user._id }).session(session || null);
      }
      throw error;
    }

    if (status === "granted" && isPluginSource) {
      const billing = await ensureUserBilling(input.user, session);
      const alreadyFunded = walletAlreadyReflectsStarterGrant(
        billing,
        SIGNUP_STARTER_GRANT_CREDITS,
      );

      if (!alreadyFunded) {
        const fundedBilling = await UserBilling.findOneAndUpdate(
          { user: input.user._id },
          { $inc: {
            availableCredits: SIGNUP_STARTER_GRANT_CREDITS,
            lifetimeBonusCredits: SIGNUP_STARTER_GRANT_CREDITS,
          } },
          { new: true, session },
        );
        if (!fundedBilling) throw new Error("Missing billing wallet.");

        await updateLegacyUserCredits(String(input.user._id), fundedBilling.availableCredits, session);

        await appendCreditLedger(
          {
            userId: String(input.user._id),
            deltaCredits: SIGNUP_STARTER_GRANT_CREDITS,
            balanceAfter: fundedBilling.availableCredits,
            reason: "starter_grant",
            idempotencyKey: `starter-grant:${input.user._id}`,
            metadata: {
              source: input.source || null,
              riskScore,
              decisionReason: grant.decisionReason,
            },
          },
          session,
        );
      } else {
        grant.notes = {
          ...(grant.notes || {}),
          walletAlreadyFunded: true,
        };
      }
    }

    if (grant.isModified()) await grant.save({ session });
    return grant;
  });
}
