/**
 * What counts as a subscription that still exists.
 *
 * This set was written out by hand in five places - the mongoose query behind
 * findCurrentSubscription, the partial unique index that enforces one live
 * subscription per user, the checkout page's refresh gate, the settings card,
 * and the cycle reconciler's scan - and it had drifted in every one of them.
 * Most of them omitted "scheduled", which is where EVERY discounted
 * subscription rests for its entire first cycle, so a customer who had just
 * paid with a code was shown as having no subscription and offered no way to
 * cancel it.
 *
 * Kept free of imports so a client component can use the same definition the
 * server does.
 */

export type LiveSubscriptionStatus =
  | "payment_pending"
  | "scheduled"
  | "active"
  | "cancel_scheduled"
  | "halted";

/**
 * Statuses in which a subscription row is still the customer's current one.
 *
 * MUST stay in step with the `one_live_subscription_per_user` partial index in
 * models/subscription.ts. A status missing here but present in the index means
 * the create route cannot see an existing subscription, makes a second one, and
 * the index rejects the insert with an opaque E11000 - after a payable
 * provider subscription has already been created and leaked.
 */
export const LIVE_SUBSCRIPTION_STATUSES: readonly LiveSubscriptionStatus[] = [
  "payment_pending",
  "scheduled",
  "active",
  "cancel_scheduled",
  "halted",
] as const;

/** True while the customer still has a subscription, whatever state it is in. */
export function isLiveSubscriptionStatus(status: string | null | undefined): boolean {
  return LIVE_SUBSCRIPTION_STATUSES.includes(status as LiveSubscriptionStatus);
}

/**
 * True when the customer is entitled to what the plan grants.
 *
 * Narrower than "live" on purpose: `payment_pending` has not paid yet and
 * `halted` needs attention before benefits resume, but BOTH are still
 * cancellable - so this must never be used to decide whether to show a cancel
 * control. Use `isLiveSubscriptionStatus` for that.
 */
export function hasSubscriptionEntitlement(status: string | null | undefined): boolean {
  return status === "active" || status === "cancel_scheduled" || status === "scheduled";
}
