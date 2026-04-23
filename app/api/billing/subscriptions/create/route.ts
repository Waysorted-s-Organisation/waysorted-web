import { NextRequest, NextResponse } from "next/server";
import BillingProduct from "@/models/billingProduct";
import {
  buildBillingSnapshot,
  createPurchaseRecord,
  ensureSubscriptionRecord,
  findCurrentSubscription,
  findPurchaseByUserAndIdempotency,
  syncCatalogProducts,
  updateBillingSubscriptionState,
} from "@/lib/billing/db";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { getCatalogProduct } from "@/lib/billing/catalog";
import { createRazorpayPlan, createRazorpaySubscription } from "@/lib/billing/razorpay";
import { getRazorpayConfig } from "@/lib/billing/env";

type SubscriptionBody = {
  productCode?: string;
  idempotencyKey?: string;
  source?: string;
  bridgeToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as SubscriptionBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productCode = body.productCode?.trim() || "";
    const idempotencyKey = body.idempotencyKey?.trim() || `subscription:${auth.user._id}:${productCode}`;
    const product = getCatalogProduct(productCode);

    if (!product || product.kind !== "subscription") {
      return NextResponse.json({ error: "Invalid subscription product." }, { status: 400 });
    }

    const snapshot = await buildBillingSnapshot(auth.user);
    const existingSubscription = await findCurrentSubscription(String(auth.user._id));
    if (existingSubscription && ["active", "cancel_scheduled", "payment_pending"].includes(existingSubscription.status)) {
      return NextResponse.json({
        subscriptionId: existingSubscription.providerSubscriptionId,
        key: getRazorpayConfig().publicKeyId,
        product,
        status: existingSubscription.status,
      });
    }

    await syncCatalogProducts();
    const productDoc = await BillingProduct.findOne({ code: product.code });
    if (!productDoc) {
      return NextResponse.json({ error: "Billing product not synced." }, { status: 500 });
    }

    if (!productDoc.providerPlanId) {
      const plan = await createRazorpayPlan({
        code: product.code,
        amountPaise: product.amountPaise,
        name: product.name,
        description: `${product.creditsGranted} yearly credits for ${product.name}`,
      });
      productDoc.providerPlanId = plan.id;
      await productDoc.save();
    }

    const existingPurchase = await findPurchaseByUserAndIdempotency(String(auth.user._id), idempotencyKey);
    const purchase =
      existingPurchase ||
      (await createPurchaseRecord({
        userId: String(auth.user._id),
        productCode: product.code,
        checkoutSource: body.source?.trim() || "billing_page",
        idempotencyKey,
        notes: {
          authType: auth.authType,
          pricingVersion: snapshot.pricingVersion,
        },
      }));

    const subscription = await createRazorpaySubscription({
      planId: productDoc.providerPlanId,
      notes: {
        userId: String(auth.user._id),
        email: auth.user.email,
        productCode: product.code,
        purchaseId: String(purchase._id),
        pricingVersion: snapshot.pricingVersion,
      },
    });

    purchase.razorpaySubscriptionId = subscription.id;
    purchase.status = "pending";
    await purchase.save();

    await ensureSubscriptionRecord({
      userId: String(auth.user._id),
      planCode: product.code,
      providerPlanId: productDoc.providerPlanId,
      providerSubscriptionId: subscription.id,
      metadata: { purchaseId: String(purchase._id) },
    });

    await updateBillingSubscriptionState({
      userId: String(auth.user._id),
      planCode: product.code,
      status: "payment_pending",
      cancelAtCycleEnd: false,
    });

    return NextResponse.json({
      purchaseId: String(purchase._id),
      subscriptionId: subscription.id,
      key: getRazorpayConfig().publicKeyId,
      product,
    });
  } catch (error) {
    console.error("POST /api/billing/subscriptions/create error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create subscription." },
      { status },
    );
  }
}
