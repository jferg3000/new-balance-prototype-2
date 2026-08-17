import { useEffect, useRef, useState, type RefObject } from "react";

/** Shoe drifts ~44px over one panel-height of scroll (motion-study-1). */
export const HERO_PARALLAX_TRAVEL_PX = 44;

type HeroParallaxResult = {
  /**
   * Zero-height sentinel placed just above the sticky hero in document flow.
   * Progress = −top / heroHeight as this mark scrolls up.
   */
  panelRef: RefObject<HTMLDivElement | null>;
  /** Sticky hero panel. */
  stickyRef: RefObject<HTMLElement | null>;
  /** translateY (px) for the product image — negative = drifts up. */
  shoeY: number;
  /** Soft fade as the next panel covers (1 → 0.75). */
  shoeOpacity: number;
};

/**
 * Parallax for stacked sticky panels — same behavior as
 * new-balance-prototype-1 `motion-study-1` (`useHeroParallax`).
 *
 * Hero is `position: sticky; top: 0`. The following page block sits at a
 * higher z-index and slides over. Over one panel-height of scroll, the shoe
 * drifts ~44px and eases opacity. No tall pin, no negative-margin pull.
 */
export function useHeroParallax(enabled: boolean): HeroParallaxResult {
  const panelRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);
  const [shoeY, setShoeY] = useState(0);
  const [shoeOpacity, setShoeOpacity] = useState(1);
  const shoeYRef = useRef(0);
  const opacityRef = useRef(1);

  useEffect(() => {
    if (!enabled) {
      shoeYRef.current = 0;
      opacityRef.current = 1;
      setShoeY(0);
      setShoeOpacity(1);
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const panel = panelRef.current;
      const sticky = stickyRef.current;
      if (!panel || !sticky) return;

      const H = Math.max(1, sticky.offsetHeight);
      const top = panel.getBoundingClientRect().top;
      // 0 at rest · 1 once one panel-height of scroll has covered the hero.
      const p = Math.min(Math.max(-top / H, 0), 1);
      const nextY = -p * HERO_PARALLAX_TRAVEL_PX;
      const nextOpacity = 1 - p * 0.25;

      if (Math.abs(nextY - shoeYRef.current) >= 0.25) {
        shoeYRef.current = nextY;
        setShoeY(nextY);
      }
      if (Math.abs(nextOpacity - opacityRef.current) >= 0.01) {
        opacityRef.current = nextOpacity;
        setShoeOpacity(nextOpacity);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return { panelRef, stickyRef, shoeY, shoeOpacity };
}
