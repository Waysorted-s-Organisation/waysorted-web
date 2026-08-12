import assert from "node:assert/strict";
import test from "node:test";
import { resolvePaidSubscriptionCycle } from "../lib/billing/webhook-payload";

test("invoice.paid resolves invoice period and payment identity", () => {
  const cycle = resolvePaidSubscriptionCycle({
    invoice: {
      entity: {
        id: "inv_1",
        subscription_id: "sub_1",
        payment_id: "pay_1",
        period_start: 1_700_000_000,
        period_end: 1_702_592_000,
      },
    },
  });

  assert.equal(cycle.subscriptionId, "sub_1");
  assert.equal(cycle.paymentId, "pay_1");
  assert.equal(cycle.cycleIdentity, "payment:pay_1");
  assert.equal(cycle.currentPeriodStart?.getTime(), 1_700_000_000_000);
  assert.equal(cycle.currentPeriodEnd?.getTime(), 1_702_592_000_000);
});

test("subscription.charged works without an invoice entity", () => {
  const cycle = resolvePaidSubscriptionCycle({
    subscription: {
      entity: {
        id: "sub_1",
        current_start: 1_700_000_000,
        current_end: 1_702_592_000,
        charge_at: 1_702_592_100,
        paid_count: 2,
      },
    },
    payment: { entity: { id: "pay_1" } },
  });

  assert.equal(cycle.subscriptionId, "sub_1");
  assert.equal(cycle.paymentId, "pay_1");
  assert.equal(cycle.cycleIdentity, "payment:pay_1");
  assert.equal(cycle.nextChargeAt?.getTime(), 1_702_592_100_000);
});

test("invoice and subscription webhook shapes deduplicate to the same payment cycle", () => {
  const invoiceCycle = resolvePaidSubscriptionCycle({
    invoice: {
      entity: { id: "inv_1", subscription_id: "sub_1", payment_id: "pay_same" },
    },
  });
  const chargedCycle = resolvePaidSubscriptionCycle({
    subscription: { entity: { id: "sub_1", paid_count: 3 } },
    payment: { entity: { id: "pay_same" } },
  });

  assert.equal(invoiceCycle.cycleIdentity, chargedCycle.cycleIdentity);
});

test("paid_count is a stable fallback when payment and invoice identities are absent", () => {
  const cycle = resolvePaidSubscriptionCycle({
    subscription: { entity: { id: "sub_1", paid_count: 4 } },
  });

  assert.equal(cycle.cycleIdentity, "paid-count:4");
});
