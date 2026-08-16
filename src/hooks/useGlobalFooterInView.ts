import { useEffect, useState } from "react";

const FOOTER_SELECTOR = "[data-global-footer]";
const DRAWER_OPEN_SELECTOR = '.fs-drawer[data-open="true"]';

/**
 * True when the global Footer approaches / enters the viewport.
 * Used to temporarily hide the fixed PDP CTA without changing ctaMode.
 *
 * rootMargin bottom inset clears the CTA before the Footer is covered
 * (tuned to CTA V2 ~50px height).
 *
 * While a full-screen drawer is open, updates are suspended so the CTA
 * does not animate under the drawer; state re-syncs on close.
 */
export default function useGlobalFooterInView(
  rootMarginBottomPx = 50,
): boolean {
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(FOOTER_SELECTOR);
    if (!footer) return;

    let suspended = Boolean(document.querySelector(DRAWER_OPEN_SELECTOR));

    const readIntersecting = () => {
      const rect = footer.getBoundingClientRect();
      const limit = window.innerHeight - rootMarginBottomPx;
      return rect.top < limit && rect.bottom > 0;
    };

    const apply = (next: boolean) => {
      if (suspended) return;
      setFooterInView(next);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        apply(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: `0px 0px -${rootMarginBottomPx}px 0px`,
      },
    );
    observer.observe(footer);

    // Seed current state when not suspended by a drawer.
    if (!suspended) apply(readIntersecting());

    const syncDrawerSuspend = () => {
      const drawerOpen = Boolean(document.querySelector(DRAWER_OPEN_SELECTOR));
      if (drawerOpen) {
        suspended = true;
        return;
      }
      if (!suspended) return;
      suspended = false;
      apply(readIntersecting());
    };

    const mutationObserver = new MutationObserver(syncDrawerSuspend);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-open"],
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [rootMarginBottomPx]);

  return footerInView;
}
