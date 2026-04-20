import type { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Payment Test",
  description: "Internal Razorpay payment test page for Waysorted.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
    },
  },
};

export default function PaymentPage() {
  return <PaymentClient />;
}
