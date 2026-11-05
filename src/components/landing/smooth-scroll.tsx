"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

// Buttery smooth scrolling for the landing page. Skipped when the user prefers reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: { offset: -90 } });
    return () => lenis.destroy();
  }, []);
  return null;
}
