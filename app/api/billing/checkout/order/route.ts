import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBridgeAuthenticatedUser } from "@/lib/billing/auth";
import { buildBillingSnapshot, createPurchaseRecord, findPurchaseByUserAndIdempotency } from "@/lib/billing/db";
import { getCatalogProduct } from "@/lib/billing/catalog";
import { createRazorpayOrder } from "@/lib/billing/razorpay";
import { getRazorpayConfig } from "@/lib/billing/env";

type OrderBody = {
  productCode?: string;
  idempotencyKey?: string;
  source?: string;
  bridgeToken?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as OrderBody;
    const auth =
      (await getAuthenticatedUser(request)) ||
      (await getBridgeAuthenticatedUser(body.bridgeToken || request.nextUrl.searchParams.get("bridge")));

    if (!auth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productCode = body.productCode?.trim() || "";
    const idempotencyKey = body.idempotencyKey?.trim() || `order:${auth.user._id}:${productCode}`;
    const product = getCatalogProduct(productCode);

    if (!product || product.kind === "subscription") {
      return NextResponse.json({ error: "Invalid one-time product." }, { status: 400 });
    }

    const snapshot = await buildBillingSnapshot(auth.user);
    const allowed = snapshot.catalog.some((item) => item.code === product.code);
    if (!allowed) {
      return NextResponse.json({ error: "Product is not currently eligible for this user." }, { status: 403 });
    }

    const existingPurchase = await findPurchaseByUserAndIdempotency(String(auth.user._id), idempotencyKey);
    if (existingPurchase?.razorpayOrderId) {
      return NextResponse.json({
        purchaseId: String(existingPurchase._id),
        orderId: existingPurchase.razorpayOrderId,
        amount: existingPurchase.amountPaise,
        currency: existingPurchase.currency,
        key: getRazorpayConfig().publicKeyId,
        product,
      });
    }

    const purchase =
      existingPurchase ||
      (await createPurchaseRecord({
        userId: String(auth.user._id),
        productCode: product.code,
        checkoutSource: body.source?.trim() || "billing_page",
        idempotencyKey,
        notes: {
          authType: auth.authType,
        },
      }));

    const order = await createRazorpayOrder({
      amountPaise: purchase.amountPaise,
      receipt: purchase.receipt,
      notes: {
        purchaseId: String(purchase._id),
        userId: String(auth.user._id),
        productCode: purchase.productCode,
        kind: purchase.kind,
      },
    });

    purchase.razorpayOrderId = order.id;
    purchase.status = "pending";
    await purchase.save();

    return NextResponse.json({
      purchaseId: String(purchase._id),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: getRazorpayConfig().publicKeyId,
      product,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout/order error:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Razorpay order." },
      { status },
    );
  }
}
