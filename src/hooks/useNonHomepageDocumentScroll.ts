import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const DEFAULT_ST_REFRESH_EVENTS =
  "resize,load,visibilitychange,DOMContentLoaded";

/**
 * Isolate native document scrolling on non-Homepage routes (PLP / Collection / PDP).
 *
 * Homepage owns its own stack gestures via `useStackedSections` (mounted only on `/`).
 * When leaving `/`, that hook unmounts and removes its listeners; this effect is the
 * layout-level safety net so commerce pages always get a clean browser scroll surface
 * (required for Safari URL bar / toolbar collapse).
 *
 * Does nothing while `isHomepage` is true — Homepage motion stays untouched.
 */
export function useNonHomepageDocumentScroll(
  isHomepage: boolean,
  pathname: string,
) {
  useEffect(() => {
    if (isHomepage) return;

    // Homepage cinematic intro body lock.
    document.body.classList.remove("is-intro-locked");
    document.body.style.background = "";
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.documentElement.style.overflow = "";

    // Defensive: restore ScrollTrigger defaults if a prior session narrowed them.
    ScrollTrigger.config({
      autoRefreshEvents: DEFAULT_ST_REFRESH_EVENTS,
      ignoreMobileResize: false,
    });

    document.documentElement.style.height = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.overscrollBehavior = "";
    document.body.style.height = "";
    document.body.style.overscrollBehavior = "";

    // Homepage `ctx.revert()` should already have run on unmount; clear orphans.
    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });

    // Intro may have left inline GSAP props on shared Promo Bar.
    const promo = document.querySelector<HTMLElement>(".promo-bar");
    if (promo) {
      gsap.set(promo, { clearProps: "opacity,y,transform,visibility" });
    }

    // Do not carry Homepage stack scrollY into the destination route.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [isHomepage, pathname]);
}
