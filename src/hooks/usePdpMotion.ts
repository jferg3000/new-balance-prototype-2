import { useLayoutEffect, useRef } from "react";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when the element top is already above the ~80% VH reveal line. */
function isPastRevealLine(el: HTMLElement): boolean {
  const triggerY = window.innerHeight * 0.8;
  return el.getBoundingClientRect().top < triggerY;
}

/**
 * PDP-only hero entrance. Progressive enhancement:
 * - No JS / reduced motion → content stays at final CSS (visible).
 * - Otherwise sets data-pdp-enter pending→in before paint, then animates via CSS.
 */
export function usePdpEnter<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    el.dataset.pdpEnter = "pending";

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.dataset.pdpEnter = "in";
      });
    });

    // Never leave the hero stuck invisible if rAF is cancelled mid-HMR/nav.
    const failsafe = window.setTimeout(() => {
      if (el.dataset.pdpEnter === "pending") {
        el.dataset.pdpEnter = "in";
      }
    }, 120);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(failsafe);
    };
  }, []);

  return ref;
}

export type PdpRevealOnceOptions = {
  /**
   * Skip pending→in animation when already past the reveal line.
   * Used for PLP lazy-batch remounts after in-viewport skeleton settle.
   */
  instantIfVisible?: boolean;
};

/**
 * Shared scroll reveal (PDP + PLP). Play once.
 *
 * Sets data-pdp-reveal="pending" in useLayoutEffect (before paint) so the
 * section never flashes at opacity:1. Trigger: section edge crosses ~80% VH
 * via rootMargin.
 */
export function usePdpRevealOnce<T extends HTMLElement>(
  options: PdpRevealOnceOptions = {},
) {
  const { instantIfVisible = false } = options;
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.dataset.pdpReveal = "in";
      return;
    }

    const reveal = () => {
      el.dataset.pdpReveal = "in";
    };

    if (instantIfVisible && isPastRevealLine(el)) {
      reveal();
      return;
    }

    // Must run before paint — useEffect painted a full-opacity frame first.
    el.dataset.pdpReveal = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      {
        root: null,
        // Shrink observer root from the bottom by 20% → fire when the
        // section intersects the upper 80% of the viewport.
        rootMargin: "0px 0px -20% 0px",
        threshold: 0,
      },
    );

    observer.observe(el);

    // Flush any intersections already true (Safari / iframe quirks).
    for (const entry of observer.takeRecords()) {
      if (entry.isIntersecting) {
        reveal();
        observer.disconnect();
        break;
      }
    }

    // If already past the reveal line but IO missed, show immediately.
    const safety = window.setTimeout(() => {
      if (el.dataset.pdpReveal === "pending" && isPastRevealLine(el)) {
        reveal();
        observer.disconnect();
      }
    }, 100);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, [instantIfVisible]);

  return ref;
}
