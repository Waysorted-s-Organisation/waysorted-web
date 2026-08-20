"use client";

import { useState } from "react";
import BillingClient from "../billing-client";

/**
 * Renders the real checkout against stubbed billing responses.
 *
 * Deliberately mounts `BillingClient` itself rather than a copy of its markup:
 * a copy drifts, and then the thing that was checked is not the thing that
 * ships. Only the network is faked.
 */
const SNAPSHOT = {
  id: "preview-user",
  name: "Preview User",
  email: "preview@waysorted.com",
  creditsRemaining: 25,
  billing: {
    wallet: { availableCredits: 25, heldCredits: 0, spendableCredits: 25 },
    subscription: {
      planCode: null,
      status: "inactive",
      renewsAt: null,
      willCancelAt: null,
      cancelAtCycleEnd: false,
    },
    capabilities: {
      customizablePresets: true,
      canPurchaseTopups: true,
      canPurchaseStarterPack: true,
    },
    // Ordered exactly as the real catalogue is - top-up first - because that
    // ordering is what made subscriptions unreachable from this page.
    catalog: [
      {
        code: "topup_std_100", name: "100 credits", kind: "topup", eligibility: "all",
        priceInr: 99, amountPaise: 9900, creditsGranted: 100, bonusCredits: 0,
        billingCycle: "one_time", currency: "INR",
      },
      {
        code: "sub_month_1", name: "Monthly 1", kind: "subscription", eligibility: "all",
        priceInr: 149, amountPaise: 14900, creditsGranted: 150, bonusCredits: 0,
        billingCycle: "monthly", currency: "INR",
      },
      {
        code: "sub_month_2", name: "Monthly 2", kind: "subscription", eligibility: "all",
        priceInr: 349, amountPaise: 34900, creditsGranted: 550, bonusCredits: 0,
        billingCycle: "monthly", currency: "INR",
      },
      {
        code: "sub_month_3", name: "Monthly 3", kind: "subscription", eligibility: "all",
        priceInr: 749, amountPaise: 74900, creditsGranted: 1500, bonusCredits: 0,
        billingCycle: "monthly", currency: "INR",
      },
      {
        code: "sub_year_1599", name: "Yearly 1", kind: "subscription", eligibility: "all",
        priceInr: 1499, amountPaise: 149900, creditsGranted: 2400, bonusCredits: 0,
        billingCycle: "yearly", currency: "INR",
      },
      {
        code: "sub_year_3499", name: "Yearly 2", kind: "subscription", eligibility: "all",
        priceInr: 3499, amountPaise: 349900, creditsGranted: 6000, bonusCredits: 0,
        billingCycle: "yearly", currency: "INR",
      },
      {
        code: "sub_year_7499", name: "Yearly 3", kind: "subscription", eligibility: "all",
        priceInr: 7499, amountPaise: 749900, creditsGranted: 14400, bonusCredits: 0,
        billingCycle: "yearly", currency: "INR",
      },
    ],
    billingDetails: {
      firstName: "Preview",
      lastName: "User",
      email: "preview@waysorted.com",
      address: "42 MG Road, Indiranagar",
      country: "india",
      city: "Bengaluru",
      zipCode: "560038",
    } as { [k: string]: string } | null,
    pricingVersion: "preview",
    pricing: {
      country: "US",
      countryName: "United States",
      tier: "tier_1",
      currency: "INR",
      riskFlags: [],
      locked: true,
      source: "preview",
    },
  },
};

const COUPONS: Record<string, number> = {
  WELCOME15: 15,
  BOOST20: 20,
  TOPUP25: 25,
  UNLOCK30: 30,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let installed = false;
function installStub() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const real = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (url.includes("/api/billing/snapshot")) return json(SNAPSHOT);
    if (url.includes("/api/billing/subscriptions/current")) return json({ subscription: null });

    if (url.includes("/api/billing/coupons/preview")) {
      const body = JSON.parse(String(init?.body || "{}")) as {
        productCode?: string;
        couponCode?: string;
      };
      const percent = COUPONS[String(body.couponCode || "").toUpperCase()];
      const product = SNAPSHOT.billing.catalog.find((item) => item.code === body.productCode);
      if (!percent || !product) return json({ valid: false, reason: "coupon_not_applicable" });
      const discountSubunits = Math.round((product.amountPaise * percent) / 100);
      return json({
        valid: true,
        coupon: {
          code: String(body.couponCode).toUpperCase(),
          percent,
          discountSubunits,
          upfrontSubunits: product.amountPaise - discountSubunits,
          recurringSubunits: product.amountPaise,
          currency: product.currency,
        },
      });
    }

    // Anything that would move money is refused rather than faked. A preview
    // must not be able to reach a payment sheet.
    if (url.includes("/api/billing/")) {
      return json({ error: "Checkout is disabled in preview." }, 400);
    }

    return real(input as RequestInfo, init);
  };
}

export default function CheckoutPreview({ withoutDetails }: { withoutDetails: boolean }) {
  const [ready] = useState(() => {
    installStub();
    return true;
  });
  if (!ready) return null;

  if (withoutDetails) SNAPSHOT.billing.billingDetails = null;
  return <BillingClient autostart={false} initialProductCode={null} />;
}
