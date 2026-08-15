"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function GoogleAnalytics({ trackingId }: { trackingId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setEnabled(true), 8_000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}');
        `}
      </Script>
    </>
  );
}
