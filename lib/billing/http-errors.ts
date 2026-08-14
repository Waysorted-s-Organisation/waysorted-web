import { NextResponse } from "next/server";

type BillingHttpError = Error & {
  status?: number;
  code?: string;
  clientSafe?: boolean;
};

export function billingErrorResponse(
  error: unknown,
  fallback: string,
  fallbackCode = "billing_request_failed",
) {
  const typed = error as BillingHttpError;
  const status = Number.isInteger(typed?.status) && typed.status! >= 400 && typed.status! < 500
    ? typed.status!
    : 500;
  return NextResponse.json(
    {
      error: typed?.clientSafe === true && typed.message ? typed.message : fallback,
      code: typed?.clientSafe === true && typed.code ? typed.code : fallbackCode,
    },
    { status },
  );
}
