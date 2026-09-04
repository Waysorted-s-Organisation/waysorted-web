"use client";

import { useEffect } from "react";
import {
  attributionFromSearchParams,
  attributionLandingPath,
  buildAttributionOpenPayload,
  captureCurrentUtmAttribution,
  getOrCreateAttributionVisitorId,
} from "@/lib/utm-attribution";

export default function UtmAttributionCapture() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const landingPath = attributionLandingPath(window.location.pathname, searchParams);
    const directAttribution = attributionFromSearchParams(
      searchParams,
      landingPath,
    );
    captureCurrentUtmAttribution();
    if (!directAttribution) return;

    try {
      const visitorId = getOrCreateAttributionVisitorId(
        window.localStorage,
        () => window.crypto.randomUUID(),
      );
      const payload = visitorId
        ? buildAttributionOpenPayload(
            directAttribution,
            visitorId,
            String(Math.round(window.performance.timeOrigin)),
          )
        : null;
      if (!payload) return;
      void fetch("/api/attribution/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => undefined);
    } catch {
      // Attribution must never interrupt navigation or checkout.
    }
  }, []);

  return null;
}
