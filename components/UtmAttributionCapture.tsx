"use client";

import { useEffect } from "react";
import { captureCurrentUtmAttribution } from "@/lib/utm-attribution";

export default function UtmAttributionCapture() {
  useEffect(() => {
    captureCurrentUtmAttribution();
  }, []);

  return null;
}
