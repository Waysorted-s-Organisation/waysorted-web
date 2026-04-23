import { getRazorpayConfig } from "@/lib/billing/env";

type RazorpayRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
};

async function razorpayRequest<T>({ method = "GET", path, body }: RazorpayRequestOptions): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig();
  const response = await fetch(`https://api.razorpay.com${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error?.description || payload?.error?.reason || payload?.message || "Razorpay API request failed.";
    const error = new Error(message) as Error & { status?: number; payload?: unknown };
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  notes?: Record<string, string>;
};

export type RazorpayPlan = {
  id: string;
  period: string;
  interval: number;
};

export type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number;
  current_end?: number;
  charge_at?: number;
  end_at?: number;
  total_count?: number;
  paid_count?: number;
  remaining_count?: number;
  notes?: Record<string, string>;
};

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpayOrder>({
    method: "POST",
    path: "/v1/orders",
    body: {
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    },
  });
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<Record<string, unknown>>({
    path: `/v1/payments/${paymentId}`,
  });
}

export async function createRazorpayPlan(input: {
  code: string;
  amountPaise: number;
  name: string;
  description: string;
}) {
  return razorpayRequest<RazorpayPlan>({
    method: "POST",
    path: "/v1/plans",
    body: {
      period: "yearly",
      interval: 1,
      item: {
        name: input.name,
        amount: input.amountPaise,
        currency: "INR",
        description: input.description,
      },
      notes: {
        productCode: input.code,
      },
    },
  });
}

export async function createRazorpaySubscription(input: {
  planId: string;
  totalCount?: number;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpaySubscription>({
    method: "POST",
    path: "/v1/subscriptions",
    body: {
      plan_id: input.planId,
      total_count: input.totalCount ?? 100,
      customer_notify: 1,
      quantity: 1,
      notes: input.notes,
    },
  });
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
  return razorpayRequest<RazorpaySubscription>({
    method: "POST",
    path: `/v1/subscriptions/${subscriptionId}/cancel`,
    body: {
      cancel_at_cycle_end: 1,
    },
  });
}

export async function fetchRazorpaySubscription(subscriptionId: string) {
  return razorpayRequest<RazorpaySubscription>({
    path: `/v1/subscriptions/${subscriptionId}`,
  });
}

export async function createRazorpayRefund(paymentId: string, input: {
  amountPaise?: number;
  notes?: Record<string, string>;
}) {
  return razorpayRequest<Record<string, unknown>>({
    method: "POST",
    path: `/v1/payments/${paymentId}/refund`,
    body: {
      amount: input.amountPaise,
      notes: input.notes || {},
    },
  });
}
