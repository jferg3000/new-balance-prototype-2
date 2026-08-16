import { useEffect, useState, type RefObject } from "react";

/** Visual presentation of the single fixed PDP CTA. */
export type PdpStickyAtcMode = "detailed" | "simple";

/**
 * Morph when the Description accordion row approaches the lower viewport.
 * Enter simple earlier (~78% vh); exit slightly later (~82% vh) for hysteresis.
 */
const ENTER_SIMPLE_RATIO = 0.78;
const EXIT_SIMPLE_RATIO = 0.82;

/**
 * Morph trigger only — the CTA is always fixed at the viewport bottom.
 * Crossing the Description-row marker switches detailed ↔ simple on the same shell.
 */
export default function usePdpStickyAtcMode(
  morphTriggerRef: RefObject<HTMLLIElement | null>,
  observeKey?: string,
): PdpStickyAtcMode {
  const [mode, setMode] = useState<PdpStickyAtcMode>("detailed");

  useEffect(() => {
    let rafId = 0;
    let attached = false;

    const readMode = (prev: PdpStickyAtcMode): PdpStickyAtcMode => {
      const triggerEl = morphTriggerRef.current;
      if (!triggerEl) return "detailed";
      const top = triggerEl.getBoundingClientRect().top;
      const vh = window.innerHeight;

      if (prev === "simple") {
        // Stay simple until Description row drops back below the exit line.
        return top > vh * EXIT_SIMPLE_RATIO ? "detailed" : "simple";
      }
      // Enter simple when Description top reaches ~78% of the viewport.
      return top <= vh * ENTER_SIMPLE_RATIO ? "simple" : "detailed";
    };

    const sync = () => {
      rafId = 0;
      setMode((prev) => {
        const next = readMode(prev);
        return prev === next ? prev : next;
      });
    };

    const onScrollOrResize = () => {
      if (!rafId) rafId = window.requestAnimationFrame(sync);
    };

    const tryAttach = () => {
      if (!morphTriggerRef.current) return false;
      if (!attached) {
        attached = true;
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);
      }
      sync();
      return true;
    };

    if (!tryAttach()) {
      rafId = window.requestAnimationFrame(() => {
        tryAttach();
      });
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (attached) {
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
      }
    };
  }, [morphTriggerRef, observeKey]);

  return mode;
}
