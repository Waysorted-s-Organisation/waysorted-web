import mongoose, { ClientSession, HydratedDocument } from "mongoose";
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
import { getProcessorCallbackSecret } from "@/lib/billing/env";
import { buildStarterSignalHashes } from "@/lib/billing/request-signals";
import {
  applyRegionalPrice,
  createPricingContext,
  getCountryTier,
  getCountryFromRequest,
  getCurrencyForCountry,
  normalizeCountry,
  getTierRank,
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
    status: string;
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
const STARTER_GRANT_CREDITS = 300;

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
    await session.endSession();
  }
}

export async function ensureUserBilling(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess">,
  session?: ClientSession,
) {
  const existing = await UserBilling.findOne({ user: user._id }).session(session || null);
  if (existing) {
    return normalizeLegacyStarterWallet(user, existing, session);
  }

  const billing = new UserBilling({
    user: user._id,
    availableCredits: typeof user.creditsRemaining === "number" ? user.creditsRemaining : 0,
    heldCredits: 0,
    pricingVersion: BILLING_PRICING_VERSION,
    pricingRiskFlags: [],
    subscriptionStatus: "inactive",
    cancelAtCycleEnd: false,
  });
  await billing.save({ session });
  return normalizeLegacyStarterWallet(user, billing, session);
}

async function normalizeLegacyStarterWallet(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess">,
  billing: HydratedDocument<IUserBilling>,
  session?: ClientSession,
) {
  const isLegacyStarterState =
    Boolean(user.earlyAccess) &&
    !billing.firstSuccessfulPurchaseAt &&
    billing.subscriptionStatus === "inactive" &&
    billing.availableCredits > STARTER_GRANT_CREDITS &&
    billing.heldCredits === 0 &&
    billing.lifetimePurchasedCredits === 0 &&
    billing.lifetimeBonusCredits === 0 &&
    billing.lifetimeSpentCredits === 0 &&
    billing.lifetimeRefundedCredits === 0;

  if (!isLegacyStarterState) {
    return billing;
  }

  const previousAvailableCredits = billing.availableCredits;
  billing.availableCredits = STARTER_GRANT_CREDITS;
  billing.lifetimeBonusCredits = STARTER_GRANT_CREDITS;
  await billing.save({ session });

  await updateLegacyUserCredits(String(user._id), billing.availableCredits, session);

  await appendCreditLedger(
    {
      userId: String(user._id),
      deltaCredits: STARTER_GRANT_CREDITS - previousAvailableCredits,
      balanceAfter: billing.availableCredits,
      reason: "manual_adjustment",
      idempotencyKey: `legacy-starter-normalize:${user._id}`,
      metadata: {
        migration: "legacy_early_access_to_starter_grant",
        previousAvailableCredits,
        normalizedAvailableCredits: STARTER_GRANT_CREDITS,
      },
    },
    session,
  );

  return billing;
}

export async function resolveUserPricingContext(
  user: Pick<IUser, "_id" | "creditsRemaining" | "earlyAccess">,
  request?: NextRequest | null,
  session?: ClientSession,
) {
  const billing = await ensureUserBilling(user, session);
  const detectedCountry = getCountryFromRequest(request);
  const recentSession = await Session.findOne({
    user: user._id,
    countryCode: { $exists: true, $ne: null },
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean<{ countryCode?: string | null; pricingTierAtAuth?: string | null } | null>()
    .session(session || null);
  const authCountry = recentSession?.countryCode || null;
  const authTier = authCountry ? getCountryTier(authCountry) : null;
  const lockedContext = createPricingContext({
    detectedCountry,
    lockedCountry: billing.pricingCountry,
    lockedTier: billing.pricingTier,
    lockedCurrency: billing.pricingCurrency,
  });
  const detectedTier = detectedCountry ? getCountryTier(detectedCountry) : null;
  const currentLockedTier = billing.pricingTier as PricingContext["tier"] | null;
  const shouldRealignToAuthCountry =
    !billing.firstSuccessfulPurchaseAt &&
    authCountry &&
    normalizeCountry(authCountry) !== normalizeCountry(billing.pricingCountry);
  const detectedOrDefaultCountry =
    authCountry &&
    authTier &&
    detectedTier &&
    getTierRank(authTier) > getTierRank(detectedTier)
      ? authCountry
      : detectedCountry;
  const detectedOrDefaultTier = detectedOrDefaultCountry ? getCountryTier(detectedOrDefaultCountry) : null;
  const shouldUpgrade =
    detectedOrDefaultCountry &&
    detectedOrDefaultTier &&
    currentLockedTier &&
    getTierRank(detectedOrDefaultTier) > getTierRank(currentLockedTier);

  const shouldLock =
    !billing.pricingCountry ||
    !billing.pricingTier ||
    shouldRealignToAuthCountry ||
    shouldUpgrade;

  if (shouldLock) {
    const countryToLock =
      shouldRealignToAuthCountry && authCountry
        ? authCountry
        : (!billing.pricingCountry || shouldUpgrade) && detectedOrDefaultCountry
        ? detectedOrDefaultCountry
        : lockedContext.country;
    const tierToLock =
      shouldRealignToAuthCountry && authTier
        ? authTier
        : (!billing.pricingTier || shouldUpgrade) && detectedOrDefaultTier
        ? detectedOrDefaultTier
        : lockedContext.tier;
    billing.pricingCountry = countryToLock;
    billing.pricingTier = tierToLock;
    billing.pricingCurrency = getCurrencyForCountry(countryToLock);
    billing.pricingLockedAt ||= new Date();
    billing.pricingLockReason = shouldRealignToAuthCountry
      ? "pre_purchase_auth_alignment"
      : shouldUpgrade
        ? "higher_tier_detection"
        : "initial_detection";
  }

  const riskFlags = [...lockedContext.riskFlags];
  if (authCountry && detectedCountry && authCountry !== normalizeCountry(detectedCountry)) {
    riskFlags.push("auth_country_differs_from_checkout_country");
  }
  billing.pricingRiskFlags = Array.from(new Set(riskFlags));
  await billing.save({ session });

  return withPricingRiskFlags(createPricingContext({
    detectedCountry,
    lockedCountry: billing.pricingCountry,
    lockedTier: billing.pricingTier,
    lockedCurrency: billing.pricingCurrency,
  }), billing.pricingRiskFlags);
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
  await syncCatalogProducts();
  const billing = await ensureUserBilling(user);
  const pricing = await resolveUserPricingContext(user, request);
  const hasActiveSubscription = isSubscriptionActive(
    billing.subscriptionStatus,
    billing.subscriptionRenewsAt || billing.subscriptionEndAt || null,
  );
  const isNewUser = !billing.firstSuccessfulPurchaseAt;

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
      status: billing.subscriptionStatus,
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
  const receipt = `ws_${product.code}_${Date.now()}`;

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

    const billing = await UserBilling.findOne({ user: lockedPurchase.user }).session(session);
    if (!billing) {
      throw new Error("Missing billing wallet.");
    }

    const totalGranted = lockedPurchase.creditsGranted + lockedPurchase.bonusCredits;
    billing.availableCredits += totalGranted;
    billing.lifetimePurchasedCredits += lockedPurchase.creditsGranted;
    billing.lifetimeBonusCredits += lockedPurchase.bonusCredits;
    billing.firstSuccessfulPurchaseAt ||= now;
    await billing.save({ session });

    await updateLegacyUserCredits(String(lockedPurchase.user), billing.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(lockedPurchase.user),
        deltaCredits: lockedPurchase.creditsGranted,
        balanceAfter: billing.availableCredits,
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
          balanceAfter: billing.availableCredits,
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
  const billing = await UserBilling.findOne({ user: input.userId }).session(input.session || null);
  if (!billing) throw new Error("Missing billing wallet.");

  billing.subscriptionStatus = input.status as typeof billing.subscriptionStatus;
  if (input.planCode !== undefined) billing.subscriptionPlanCode = input.planCode;
  if (input.currentPeriodStart !== undefined) billing.subscriptionStartAt = input.currentPeriodStart;
  if (input.currentPeriodEnd !== undefined) billing.subscriptionEndAt = input.currentPeriodEnd;
  if (input.renewsAt !== undefined) billing.subscriptionRenewsAt = input.renewsAt;
  if (input.cancelAtCycleEnd !== undefined) billing.cancelAtCycleEnd = input.cancelAtCycleEnd;
  billing.subscriptionWillCancelAt =
    input.cancelAtCycleEnd && input.currentPeriodEnd ? input.currentPeriodEnd : null;
  await billing.save({ session: input.session });
  return billing;
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

    const lockedSubscription = await Subscription.findOneAndUpdate(
      {
        _id: input.subscription._id,
        lastCreditsGrantCycleKey: { $ne: input.cycleKey },
      },
      {
        $set: {
          lastCreditsGrantCycleKey: input.cycleKey,
          lastCreditsGrantedAt: new Date(),
          lastPaymentId: input.paymentId || null,
        },
      },
      { new: true, session },
    );

    if (!lockedSubscription) {
      const existingSubscription = await Subscription.findById(input.subscription._id).session(session);
      if (!existingSubscription) {
        throw new Error("Subscription not found.");
      }
      return existingSubscription;
    }

    const billing = await UserBilling.findOne({ user: lockedSubscription.user }).session(session);
    if (!billing) {
      throw new Error("Missing billing wallet.");
    }

    billing.availableCredits += product.creditsGranted;
    billing.lifetimePurchasedCredits += product.creditsGranted;
    billing.subscriptionStatus = lockedSubscription.status === "cancel_scheduled" ? "cancel_scheduled" : "active";
    billing.subscriptionPlanCode = lockedSubscription.planCode;
    billing.subscriptionRenewsAt =
      lockedSubscription.nextChargeAt || lockedSubscription.currentPeriodEnd || null;
    billing.subscriptionEndAt = lockedSubscription.currentPeriodEnd || null;
    await billing.save({ session });

    await updateLegacyUserCredits(String(lockedSubscription.user), billing.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(lockedSubscription.user),
        deltaCredits: product.creditsGranted,
        balanceAfter: billing.availableCredits,
        reason: "subscription_cycle_grant",
        subscriptionId: String(lockedSubscription._id),
        idempotencyKey: `subscription-cycle:${lockedSubscription._id}:${input.cycleKey}`,
        metadata: {
          cycleKey: input.cycleKey,
          paymentId: input.paymentId || null,
          planCode: lockedSubscription.planCode,
        },
      },
      session,
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
    const existing = await UsageReservation.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
    if (existing) return existing;

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
        deltaCredits: -input.creditsRequired,
        balanceAfter: billing.availableCredits,
        reason: "reservation_hold",
        featureCode: input.featureCode,
        toolCode: input.toolCode || null,
        reservationId: String(reservation._id),
        idempotencyKey: `reservation-hold:${reservation._id}`,
        metadata: { expiresAt: expiresAt.toISOString() },
      },
      session,
    );

    return reservation;
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

    if (existingReservation.status === "committed") return existingReservation;
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
        deltaCredits: 0,
        balanceAfter: billing.availableCredits,
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

export async function releaseReservation(input: {
  userId: string;
  reservationId?: string | null;
  idempotencyKey?: string | null;
  reason?: string | null;
  compensateCommitted?: boolean;
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
          deltaCredits: reservation.creditsReserved,
          balanceAfter: billing.availableCredits,
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
        { user: reservation.user },
        { $inc: { availableCredits: reservation.creditsReserved } },
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

export async function expireStaleReservations() {
  const staleReservations = await UsageReservation.find({
    status: "reserved",
    expiresAt: { $lte: new Date() },
  });

  for (const reservation of staleReservations) {
    await releaseReservation({
      userId: String(reservation.user),
      reservationId: String(reservation._id),
      reason: "expired",
    });
  }
}

export async function recordProcessorReservationStatus(input: {
  userId: string;
  reservationId: string;
  processor?: string | null;
  processorJobId?: string | null;
  status: "accepted" | "completed" | "failed";
  reason?: string | null;
  metadata?: Record<string, unknown>;
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

  reservation.metadata = {
    ...(reservation.metadata || {}),
    processorStatus: input.status,
    processorReason: input.reason || null,
    processorUpdatedAt: new Date().toISOString(),
    ...(input.metadata || {}),
  };

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
    status: { $in: ["payment_pending", "active", "cancel_scheduled", "halted"] },
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
    purchase.refundedCreditsApplied = (purchase.refundedCreditsApplied || 0) + deltaCreditsToReverse;
    await purchase.save({ session });

    if (deltaCreditsToReverse === 0) {
      return purchase;
    }

    billing.availableCredits -= deltaCreditsToReverse;
    billing.lifetimeRefundedCredits += deltaCreditsToReverse;
    await billing.save({ session });
    await updateLegacyUserCredits(String(purchase.user), billing.availableCredits, session);

    await appendCreditLedger(
      {
        userId: String(purchase.user),
        deltaCredits: -deltaCreditsToReverse,
        balanceAfter: billing.availableCredits,
        reason: "refund_debit",
        purchaseId: String(purchase._id),
        refundId: input.refundId,
        idempotencyKey: `refund-debit:${input.refundId}`,
        metadata: {
          amountPaise: input.amountPaise,
          productCode: purchase.productCode,
          cumulativeRefundAmount,
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
  user: Pick<IUser, "_id" | "email" | "creditsRemaining" | "earlyAccess">;
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
      grantedCredits: STARTER_GRANT_CREDITS,
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

    if (status === "granted" && isPluginSource) {
      const billing = await ensureUserBilling(input.user, session);
      billing.availableCredits += STARTER_GRANT_CREDITS;
      billing.lifetimeBonusCredits += STARTER_GRANT_CREDITS;
      await billing.save({ session });

      await updateLegacyUserCredits(String(input.user._id), billing.availableCredits, session);

      await appendCreditLedger(
        {
          userId: String(input.user._id),
          deltaCredits: STARTER_GRANT_CREDITS,
          balanceAfter: billing.availableCredits,
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
    }

    await grant.save({ session });
    return grant;
  });
}
