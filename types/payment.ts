export type PlanId = "starter" | "pro" | "scale";
export type BillingCycle = "monthly" | "yearly";
export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export interface PaymentOrderRequest {
  planId: PlanId;
  billing: BillingCycle;
}

export interface PaymentOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  planId: PlanId;
  billing: BillingCycle;
  creditsToAdd: number;
  keyId: string;
}

export interface PaymentVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerifyResponse {
  ok: boolean;
  paymentId: string;
  status: PaymentStatus;
  creditsAdded: number;
  creditsRemaining: number;
}
