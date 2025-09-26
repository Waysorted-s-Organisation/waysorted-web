"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

export default function ScrollProvider({
  children,
  duration = 6,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);
  const isFrozen = useRef(false);
  const wheelTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    /** 🔹 Animation frame loop */
    function raf(time: number) {
      if (!isFrozen.current) {
        lenis.raf(time);
      }
      frameRef.current = requestAnimationFrame(raf);
    }
    frameRef.current = requestAnimationFrame(raf);

    const handleWheel = () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      // Resume immediately when scrolling starts
      if (isFrozen.current) {
        isFrozen.current = false;
      }

      // Freeze AFTER no wheel events for 50ms
      wheelTimeoutRef.current = window.setTimeout(() => {
        if (lenisRef.current) {
          const current = lenisRef.current.scroll;
          lenisRef.current.scrollTo(current, { immediate: true });
          isFrozen.current = true;
        }
      }, 50);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      window.removeEventListener("wheel", handleWheel);
      lenis.destroy();
    };
  }, [duration]);

  return <>{children}</>;
}
