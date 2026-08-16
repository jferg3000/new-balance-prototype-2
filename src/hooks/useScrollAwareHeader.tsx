import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TOP_THRESHOLD_PX = 8;
const DIRECTION_THRESHOLD_PX = 10;

export type ScrollDirection = "up" | "down" | null;

export type ScrollAwareHeaderState = {
  /** False on Homepage — chrome stays static. */
  enabled: boolean;
  isAtTop: boolean;
  scrollDirection: ScrollDirection;
  showPromoBar: boolean;
  showNavigation: boolean;
  /**
   * Nav transform mode for CSS:
   * - shown: below promo (default)
   * - solo: promo hidden, nav at viewport top
   * - hidden: fully off-screen
   */
  navMode: "shown" | "solo" | "hidden";
};

const DEFAULT_STATE: ScrollAwareHeaderState = {
  enabled: false,
  isAtTop: true,
  scrollDirection: null,
  showPromoBar: true,
  showNavigation: true,
  navMode: "shown",
};

const ScrollHeaderContext = createContext<ScrollAwareHeaderState>(DEFAULT_STATE);

function isBodyScrollLocked() {
  return document.body.style.position === "fixed";
}

function navModeFor(
  showPromoBar: boolean,
  showNavigation: boolean,
): ScrollAwareHeaderState["navMode"] {
  if (!showNavigation) return "hidden";
  if (!showPromoBar) return "solo";
  return "shown";
}

/**
 * Scroll-direction header visibility for non-homepage routes.
 * Homepage keeps the default always-visible chrome.
 */
export function useScrollAwareHeader(
  enabled: boolean,
  routeKey = "",
): ScrollAwareHeaderState {
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [showNavigation, setShowNavigation] = useState(true);

  const lastYRef = useRef(0);
  const lockedRef = useRef(false);
  const rafRef = useRef(0);
  const pendingYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsAtTop(true);
      setScrollDirection(null);
      setShowPromoBar(true);
      setShowNavigation(true);
      return;
    }

    const applyY = (y: number) => {
      if (isBodyScrollLocked()) return;

      const atTop = y <= TOP_THRESHOLD_PX;
      setIsAtTop(atTop);

      if (atTop) {
        setScrollDirection(null);
        setShowPromoBar(true);
        setShowNavigation(true);
        lastYRef.current = y;
        return;
      }

      const delta = y - lastYRef.current;
      if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;

      if (delta > 0) {
        setScrollDirection("down");
        setShowPromoBar(false);
        setShowNavigation(false);
      } else {
        setScrollDirection("up");
        setShowPromoBar(false);
        setShowNavigation(true);
      }
      lastYRef.current = y;
    };

    const flush = () => {
      rafRef.current = 0;
      const y = pendingYRef.current;
      pendingYRef.current = null;
      if (y !== null) applyY(y);
    };

    const onScroll = () => {
      if (isBodyScrollLocked()) return;
      pendingYRef.current = window.scrollY;
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(flush);
      }
    };

    // Drawer lock uses body position:fixed — pause while locked; re-sync after unlock.
    const onBodyAttr = () => {
      const locked = isBodyScrollLocked();
      if (lockedRef.current && !locked) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            lastYRef.current = window.scrollY;
            applyY(window.scrollY);
          });
        });
      }
      lockedRef.current = locked;
    };

    lastYRef.current = window.scrollY;
    lockedRef.current = isBodyScrollLocked();
    applyY(window.scrollY);

    window.addEventListener("scroll", onScroll, { passive: true });
    const observer = new MutationObserver(onBodyAttr);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, routeKey]);

  return useMemo(
    () => ({
      enabled,
      isAtTop,
      scrollDirection,
      showPromoBar: enabled ? showPromoBar : true,
      showNavigation: enabled ? showNavigation : true,
      navMode: enabled
        ? navModeFor(showPromoBar, showNavigation)
        : ("shown" as const),
    }),
    [enabled, isAtTop, scrollDirection, showPromoBar, showNavigation],
  );
}

export function ScrollHeaderProvider({
  enabled,
  /** Remount/resync scroll state when the route changes. */
  routeKey,
  children,
}: {
  enabled: boolean;
  routeKey: string;
  children: ReactNode;
}) {
  const value = useScrollAwareHeader(enabled, routeKey);
  return (
    <ScrollHeaderContext.Provider value={value}>
      {children}
    </ScrollHeaderContext.Provider>
  );
}

export function useScrollHeader() {
  return useContext(ScrollHeaderContext);
}
