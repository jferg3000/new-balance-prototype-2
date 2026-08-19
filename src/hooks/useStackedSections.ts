import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, CustomEase);

// Soft settle — cubic-bezier(0.16, 1, 0.3, 1). Same family as the nav cube.
CustomEase.create("stackSnap", "M0,0 C0.16,1 0.3,1 1,1");
// Time-mirror for reverse: cubic-bezier(0.7, 0, 0.84, 0).
CustomEase.create("stackSnapReverse", "M0,0 C0.7,0 0.84,0 1,1");

type Options = {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  onNavColorChange?: (color: "white" | "black") => void;
  /** True once scroll leaves the last card into the document-flow footer. */
  onFooterZoneChange?: (inFooter: boolean) => void;
  /** Scroll to a settled stacked card by `data-node-id` after the timeline mounts. */
  focusCardNodeId?: string | null;
  onFocusCardApplied?: () => void;
};

const NAV_PROBE = 30;
const DWELL = 0.4;

/** Treat as tap until movement exceeds this (px). */
const TAP_TOLERANCE_PX = 10;
/** Start 1:1 card follow after this travel (px). */
const SWIPE_FOLLOW_PX = 10;
/** Release past this fraction of the viewport → commit to the next card. */
const SWIPE_COMMIT_RATIO = 0.35;
/** Quick flick threshold (px / ms). */
const SWIPE_VELOCITY_PX_MS = 0.4;
/**
 * Post-release settle. Touch is longer so the cover glides instead of snapping.
 * Remaining-distance scales the actual tween (almost-there stays short).
 */
const SNAP_DURATION = 1.05;
const SNAP_DURATION_TOUCH = 1.12;
/** Keep full travel after commit (no mid-transition jump). */
const COMMIT_JUMP_RATIO = 0;
/** Forward: cubic-bezier(0.16, 1, 0.3, 1). Reverse uses stackSnapReverse. */
const SNAP_EASE = "stackSnap";
const SNAP_EASE_REVERSE = "stackSnapReverse";
const SNAP_DURATION_REDUCED = 0.01;
/**
 * Under-card recede: zoom slightly inside the clipped stage so the frame
 * stays full-bleed (scale-down would letterbox against the black stage).
 */
const UNDER_SCALE = 1.06;
const UNDER_ALPHA = 0.82;

const STACK_GESTURE_IGNORE =
  'a, button, input, select, textarea, [role="button"], [data-no-stack-gesture]';

type InteractiveTouchGuard = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  scrollY: number;
  allowScroll: boolean;
  /**
   * Large interactive hit areas (e.g. 9060 copy link) can trap swipes.
   * Allow a clear vertical drag to promote back into a stack gesture.
   */
  allowStackPromote: boolean;
};

type StackSwipeGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  startScrollY: number;
  startIndex: number;
  committed: boolean;
  /** Scroll Y that maps to finger dy = 0 after skipping the hold. */
  followOriginY?: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readNavColor(panels: HTMLElement[]): "white" | "black" {
  const globalFooter = document.querySelector<HTMLElement>("[data-global-footer]");
  if (globalFooter) {
    const footerRect = globalFooter.getBoundingClientRect();
    if (footerRect.top <= NAV_PROBE && footerRect.bottom > NAV_PROBE) {
      return "black";
    }
  }

  for (let i = panels.length - 1; i >= 0; i--) {
    const el = panels[i];
    const rect = el.getBoundingClientRect();
    if (rect.top <= NAV_PROBE && rect.bottom > NAV_PROBE) {
      const color = el.dataset.navColor;
      if (color === "white" || color === "black") return color;
    }
  }
  return "white";
}

/**
 * Sticky absolute stack:
 * hold → slide next up + scale previous → hold → …
 *
 * Desktop: scrubbed ScrollTrigger + snap to settled cards.
 * Touch: finger follows 1:1, then a long settle on release. Native scroll must
 * not scrub the card stack; Safari chrome may stay expanded on Homepage.
 *
 * Policy: Safari URL bar + toolbar stay EXPOSED for the session. Scroll runs on
 * `.page`, not the document — root document scroll is what toggles iOS chrome.
 *
 * Homepage Footer is outside the stack (normal document flow below the
 * final content card) and is not part of this timeline.
 */
export function useStackedSections({
  containerRef,
  enabled,
  onNavColorChange,
  onFooterZoneChange,
  focusCardNodeId,
  onFocusCardApplied,
}: Options) {
  const pendingFocusRef = useRef(focusCardNodeId ?? null);
  const onFocusCardAppliedRef = useRef(onFocusCardApplied);
  onFocusCardAppliedRef.current = onFocusCardApplied;
  const onFooterZoneChangeRef = useRef(onFooterZoneChange);
  onFooterZoneChangeRef.current = onFooterZoneChange;

  if (focusCardNodeId) {
    pendingFocusRef.current = focusCardNodeId;
  }

  useEffect(() => {
    if (!enabled) return;

    const root = containerRef.current;
    if (!root) return;

    const wrap = root.querySelector<HTMLElement>("[data-stack-wrap]");
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>("[data-stacked-card]"),
    );
    if (!wrap || panels.length < 2) return;

    /*
     * Scroll inside `.page` (root), not the document. iOS Safari only collapses
     * its URL bar / toolbar when the root document scrolls — an inner scrollport
     * keeps chrome locked in the initial exposed state for the whole session.
     */
    const scroller = root;
    const viewH = () => scroller.clientHeight || window.innerHeight;
    const getScrollY = () => scroller.scrollTop;
    const setScrollY = (y: number) => {
      scroller.scrollTop = y;
    };

    // Keep document pinned so Safari never receives root scroll.
    window.scrollTo(0, 0);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const transitions = panels.length - 1;
    const prefersTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;

    const timelineUnits = transitions * (1 + DWELL);
    const wrapUnits = timelineUnits + 1;

    const syncNavColor = () => onNavColorChange?.(readNavColor(panels));

    const wrapTop = () =>
      wrap.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    /** Full page scroll range so the document-flow footer below the stack is reachable. */
    const maxScrollY = () => Math.max(0, scroller.scrollHeight - viewH());

    /** Settled scroll Y for each full-screen content card. */
    const cardScrollY = (index: number) => {
      const i = Math.max(0, Math.min(panels.length - 1, index));
      return wrapTop() + i * (1 + DWELL) * viewH();
    };

    const lastCardIndex = () => panels.length - 1;

    /** True once scroll has left the stack and entered the footer below. */
    const inFooterZone = (scrollY = getScrollY()) =>
      scrollY > cardScrollY(lastCardIndex()) + Math.max(8, viewH() * 0.05);

    let lastFooterZone: boolean | null = null;
    const syncFooterZone = (scrollY = getScrollY()) => {
      const next = inFooterZone(scrollY);
      if (lastFooterZone === next) return;
      lastFooterZone = next;
      onFooterZoneChangeRef.current?.(next);
    };

    const footerScrollY = () => {
      const footer = root.querySelector<HTMLElement>("[data-global-footer]");
      if (!footer) return maxScrollY();
      return (
        footer.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop
      );
    };

    const indexFromScroll = (scrollY: number) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < panels.length; i++) {
        const d = Math.abs(scrollY - cardScrollY(i));
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      // Past last card into the document-flow footer → treat as last card.
      if (scrollY > cardScrollY(panels.length - 1) + viewH() * 0.25) {
        return panels.length - 1;
      }
      return best;
    };

    let snapTween: gsap.core.Tween | null = null;
    let snapping = false;
    /** While set, reject any scroll that isn't owned by the snap tween. */
    let snapLockY: number | null = null;
    /** Card index the in-flight snap is heading toward (mobile reverse unlock). */
    let snapTargetIndex: number | null = null;
    /* Declared early so snap onComplete can reset leftover touch state. */
    let swipe: StackSwipeGesture | null = null;
    let interactiveGuard: InteractiveTouchGuard | null = null;
    /** After promoting a link-press to a stack swipe, ignore the trailing click. */
    let suppressClickUntil = 0;
    /**
     * Touch only: swipe arming waits until post-intro measure/refresh completes
     * so the first gesture matches later ones.
     */
    let gesturesReady = !prefersTouch;
    /** Finger is down in the stack region (not footer) — pin scroll until Path A. */
    let stackTouchActive = false;
    let pinY = 0;

    const applyFocusCard = () => {
      const focusId = pendingFocusRef.current;
      if (!focusId) return false;
      const focusIndex = panels.findIndex(
        (el) => el.getAttribute("data-node-id") === focusId,
      );
      if (focusIndex < 0) return false;
      setScrollY(cardScrollY(focusIndex));
      ScrollTrigger.update();
      syncNavColor();
      syncFooterZone();
      return true;
    };

    const unlockSnap = () => {
      snapping = false;
      snapTween = null;
      snapLockY = null;
      snapTargetIndex = null;
    };

    const killSnap = () => {
      if (snapTween) snapTween.kill();
      unlockSnap();
    };

    const snapToScrollY = (
      targetY: number,
      options?: {
        fromY?: number;
        jumpRatio?: number;
        duration?: number;
        targetIndex?: number;
        ease?: string;
      },
    ) => {
      const y = Math.max(0, Math.min(maxScrollY(), targetY));
      const fromY =
        options?.fromY !== undefined ? options.fromY : getScrollY();
      const jumpRatio = options?.jumpRatio ?? 0;
      const duration = prefersReducedMotion()
        ? SNAP_DURATION_REDUCED
        : options?.duration !== undefined
          ? options.duration
          : prefersTouch
            ? SNAP_DURATION_TOUCH *
              gsap.utils.clamp(
                0.42,
                1,
                0.4 +
                  (0.6 * Math.abs(y - fromY)) /
                    Math.max(1, (1 + DWELL) * viewH()),
              )
            : SNAP_DURATION;
      const targetIndex =
        options?.targetIndex !== undefined ? options.targetIndex : null;
      const ease = options?.ease ?? SNAP_EASE;

      killSnap();
      snapping = true;
      snapTargetIndex = targetIndex;

      // Optional commit jump (disabled when COMMIT_JUMP_RATIO is 0) — full
      // start→target travel plays so scale-back + cover depth stay readable.
      let startY = fromY;
      if (jumpRatio > 0 && !prefersReducedMotion()) {
        startY = fromY + (y - fromY) * jumpRatio;
        setScrollY(startY);
        ScrollTrigger.update();
        syncNavColor();
        syncFooterZone();
      } else if (Math.abs(getScrollY() - fromY) > 0.5) {
        setScrollY(fromY);
        ScrollTrigger.update();
      }

      snapLockY = startY;
      snapTween = gsap.to(scroller, {
        scrollTo: { y, autoKill: false },
        duration,
        ease,
        overwrite: true,
        onUpdate: () => {
          snapLockY = getScrollY();
          syncNavColor();
          syncFooterZone();
        },
        onComplete: () => {
          unlockSnap();
          setScrollY(y);
          ScrollTrigger.update();
          syncNavColor();
          syncFooterZone();
          // Clear leftover gesture state so the next touch starts clean.
          swipe = null;
          interactiveGuard = null;
          stackTouchActive = false;
        },
      });
    };

    const snapToCardIndex = (
      index: number,
      options?: {
        fromY?: number;
        jumpRatio?: number;
        duration?: number;
        ease?: string;
      },
    ) => {
      // Recompute target at call time (Safari toolbar may have changed vh).
      const i = Math.max(0, Math.min(panels.length - 1, index));
      snapToScrollY(cardScrollY(i), { ...options, targetIndex: i });
    };

    const ctx = gsap.context(() => {
      wrap.style.setProperty("--stack-scroll-units", String(wrapUnits));
      wrap.style.setProperty("--stack-view-h", `${viewH()}px`);

      panels.forEach((panel, i) => {
        gsap.set(panel, {
          zIndex: 10 + i,
          x: 0,
          y: 0,
          yPercent: i === 0 ? 0 : 100,
          scale: 1,
          autoAlpha: 1,
          visibility: "visible",
          transformOrigin: "center center",
          force3D: true,
        });
      });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          scroller,
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          // Touch: scrub follows Path A scrollTo only. Do not fast-catch native flings.
          scrub: prefersTouch ? true : 0.45,
          fastScrollEnd: prefersTouch ? false : true,
          anticipatePin: 1,
          onUpdate: () => {
            syncNavColor();
            syncFooterZone();
          },
        },
      });

      let t = 0;
      for (let i = 0; i < transitions; i++) {
        const current = panels[i];
        const next = panels[i + 1];

        tl.to({}, { duration: DWELL }, t);
        t += DWELL;

        tl.fromTo(
          current,
          { scale: 1, autoAlpha: 1 },
          {
            scale: UNDER_SCALE,
            autoAlpha: UNDER_ALPHA,
            duration: 1,
            transformOrigin: "center center",
            immediateRender: false,
          },
          t,
        );

        tl.fromTo(
          next,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: 1,
            immediateRender: false,
          },
          t,
        );

        t += 1;
        tl.set(current, { autoAlpha: 0 }, t);
      }

      // Desktop / fine pointer: ScrollTrigger snap to settled cards.
      // Touch uses the custom one-card swipe controller below instead.
      if (!prefersTouch) {
        const settled = Array.from({ length: panels.length }, (_, k) =>
          Math.min(1, (k * (1 + DWELL)) / timelineUnits),
        );

        ScrollTrigger.create({
          scroller,
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          snap: {
            snapTo: (value) => gsap.utils.snap(settled)(value),
            duration: prefersReducedMotion()
              ? SNAP_DURATION_REDUCED
              : SNAP_DURATION,
            delay: 0,
            ease: SNAP_EASE,
            directional: true,
          },
        });
      }

      syncNavColor();
      syncFooterZone();
      ScrollTrigger.refresh();
      applyFocusCard();
      window.requestAnimationFrame(() => {
        applyFocusCard();
      });
    }, root);

    const freezeAt = (y: number) => {
      if (getScrollY() !== y) {
        setScrollY(y);
      }
    };

    /** Final touch measure after intro/layout — then arm Path A gestures. */
    const finalizeTouchReady = () => {
      if (!prefersTouch || gesturesReady) return;
      wrap.style.setProperty("--stack-view-h", `${viewH()}px`);
      ScrollTrigger.refresh();
      applyFocusCard();
      killSnap();
      swipe = null;
      interactiveGuard = null;
      stackTouchActive = false;
      pinY = getScrollY();
      gesturesReady = true;
      syncNavColor();
    };

    const onScroll = () => {
      // During snap, kill any residual touch/browser scroll so the card
      // cannot keep tracking the finger.
      if (snapping && snapLockY !== null && snapTween) {
        // Tween owns scroll; only sync chrome.
        syncNavColor();
        syncFooterZone();
        return;
      }
      // Touch stack press: native scroll must not scrub cards (Path B block).
      // During an uncommitted drag the finger owns scroll — do not freeze.
      if (prefersTouch && swipe && !swipe.committed) {
        syncNavColor();
        syncFooterZone();
        return;
      }
      if (
        prefersTouch &&
        (stackTouchActive || interactiveGuard) &&
        !swipe?.committed
      ) {
        const y = interactiveGuard?.scrollY ?? pinY;
        freezeAt(y);
        syncNavColor();
        syncFooterZone();
        return;
      }
      onNavColorChange?.(readNavColor(panels));
      syncFooterZone();
    };
    const onResize = () => {
      wrap.style.setProperty("--stack-view-h", `${viewH()}px`);
      ScrollTrigger.refresh();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const t1 = window.setTimeout(() => {
      ScrollTrigger.refresh();
      if (applyFocusCard()) {
        pendingFocusRef.current = null;
        onFocusCardAppliedRef.current?.();
      }
    }, 50);
    const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    // Post-intro: one more measure pass, then enable the first mobile swipe.
    let tReady = 0;
    if (prefersTouch) {
      tReady = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            finalizeTouchReady();
          });
        });
      }, 120);
    }

    /* —— Touch: 1:1 follow, then a long settle (Path A) —— */

    const clearSwipe = () => {
      swipe = null;
    };

    const clearInteractiveGuard = () => {
      interactiveGuard = null;
    };

    const stackStartIndex = (scrollY: number) => {
      if (snapTargetIndex !== null) return snapTargetIndex;
      if (inFooterZone(scrollY)) return lastCardIndex();
      return indexFromScroll(scrollY);
    };

    const followRange = (gesture: StackSwipeGesture) => {
      const fromIndex = Math.max(0, Math.min(lastCardIndex(), gesture.startIndex));
      const last = lastCardIndex();
      const minY = fromIndex <= 0 ? cardScrollY(0) : cardScrollY(fromIndex - 1);
      const maxY =
        fromIndex >= last ? footerScrollY() : cardScrollY(fromIndex + 1);
      return { minY, maxY };
    };

    const applySwipeFollow = (gesture: StackSwipeGesture, clientY: number) => {
      if (snapping) killSnap();
      const dy = clientY - gesture.startY;
      const fromIndex = Math.max(0, Math.min(lastCardIndex(), gesture.startIndex));
      const fromY = cardScrollY(fromIndex);
      const { minY, maxY } = followRange(gesture);
      // Forward cover sits after a hold. Skip that hold so the next card
      // tracks the finger 1:1 instead of waiting through empty scroll.
      if (gesture.followOriginY === undefined) {
        gesture.followOriginY =
          dy < 0 ? Math.min(maxY, fromY + DWELL * viewH()) : fromY;
      }
      const y = Math.max(
        minY,
        Math.min(maxY, gesture.followOriginY - dy),
      );
      if (Math.abs(getScrollY() - y) > 0.25) {
        setScrollY(y);
        ScrollTrigger.update();
      }
      syncNavColor();
      syncFooterZone();
    };

    const commitSwipe = (gesture: StackSwipeGesture, direction: 1 | -1) => {
      if (gesture.committed) return;
      if (!prefersTouch || !gesturesReady) return;

      const last = lastCardIndex();

      // Allow interrupting an in-flight settle once swipe intent is clear.
      if (snapping) {
        killSnap();
      }

      gesture.committed = true;

      const fromIndex = Math.max(0, Math.min(last, gesture.startIndex));
      const next = Math.max(0, Math.min(last, fromIndex + direction));
      // Continue from the live follow position — never jump back to the card start.
      let fromY = getScrollY();
      if (direction > 0) {
        const coverStart = Math.min(
          cardScrollY(fromIndex) + DWELL * viewH(),
          fromIndex >= last ? footerScrollY() : cardScrollY(fromIndex + 1),
        );
        if (fromY < coverStart - 0.5) {
          fromY = coverStart;
          setScrollY(fromY);
          ScrollTrigger.update();
        }
      }

      const finish = {
        fromY,
        jumpRatio: COMMIT_JUMP_RATIO,
        // Forward ease-out; reverse ease-in (mirrored) so cover-undo isn't rushed.
        ease: direction < 0 ? SNAP_EASE_REVERSE : SNAP_EASE,
      };

      // Scrolled into the document-flow footer — reverse returns to final card.
      if (direction < 0 && inFooterZone(fromY)) {
        snapToCardIndex(last, finish);
        return;
      }

      // Final content card forward → leave the stack into the footer below.
      if (direction > 0 && fromIndex >= last) {
        snapToScrollY(footerScrollY(), finish);
        return;
      }

      snapToCardIndex(next, finish);
    };

    const promoteInteractiveToSwipe = (
      guard: InteractiveTouchGuard,
      clientY: number,
      clientX: number,
    ): boolean => {
      if (!guard.allowStackPromote) return false;
      const dy = clientY - guard.startY;
      const ady = Math.abs(dy);
      const adx = Math.abs(clientX - guard.startX);
      if (ady < SWIPE_FOLLOW_PX || ady < adx) return false;

      const gesture: StackSwipeGesture = {
        pointerId: guard.pointerId,
        startX: guard.startX,
        startY: guard.startY,
        startTime: guard.startTime,
        startScrollY: guard.scrollY,
        startIndex: stackStartIndex(guard.scrollY),
        committed: false,
      };
      clearInteractiveGuard();
      swipe = gesture;
      suppressClickUntil = performance.now() + 600;
      applySwipeFollow(gesture, clientY);
      return true;
    };

    const onClickCapture = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const target = event.target;
      if (!(target instanceof Element) || !root.contains(target)) return;

      // Footer is normal page flow — let native scroll handle it.
      if (
        target.closest("[data-global-footer]") ||
        inFooterZone(getScrollY())
      ) {
        interactiveGuard = null;
        swipe = null;
        stackTouchActive = false;
        return;
      }

      // Pin stack scroll for this finger; Path A only after gesturesReady.
      stackTouchActive = true;
      pinY = getScrollY();

      if (!gesturesReady) {
        interactiveGuard = null;
        swipe = null;
        freezeAt(pinY);
        return;
      }

      // Mobile: still arm tracking during snap settle; commit may interrupt
      // the in-flight tween once swipe intent is clear.

      const interactive = target.closest(STACK_GESTURE_IGNORE);
      if (interactive && root.contains(interactive)) {
        // Taps on CTAs/links must not start a stack gesture — except the 9060
        // copy hit Link (title + subtitle + CTA zone), which can trap swipes.
        const inProductHit = Boolean(target.closest(".section__product-hit"));
        interactiveGuard = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startTime: performance.now(),
          scrollY: getScrollY(),
          allowScroll: false,
          allowStackPromote: inProductHit,
        };
        swipe = null;
        return;
      }

      interactiveGuard = null;
      swipe = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now(),
        startScrollY: getScrollY(),
        startIndex: stackStartIndex(getScrollY()),
        committed: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!gesturesReady && stackTouchActive) {
        event.preventDefault();
        freezeAt(pinY);
        return;
      }

      if (interactiveGuard && event.pointerId === interactiveGuard.pointerId) {
        event.preventDefault();
        if (
          promoteInteractiveToSwipe(
            interactiveGuard,
            event.clientY,
            event.clientX,
          )
        ) {
          return;
        }
        // Keep scroll frozen for the interactive press — tap only.
        freezeAt(interactiveGuard.scrollY);
        return;
      }

      if (!swipe || event.pointerId !== swipe.pointerId) {
        if (stackTouchActive && !snapping) {
          event.preventDefault();
          freezeAt(pinY);
        }
        return;
      }

      // After commit the tween owns motion — ignore the finger entirely.
      if (swipe.committed) {
        event.preventDefault();
        return;
      }

      event.preventDefault();

      const dy = event.clientY - swipe.startY;
      const ady = Math.abs(dy);
      const adx = Math.abs(event.clientX - swipe.startX);

      if (ady < SWIPE_FOLLOW_PX || ady < adx) {
        if (!snapping) freezeAt(swipe.startScrollY);
        return;
      }

      applySwipeFollow(swipe, event.clientY);
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (
        interactiveGuard &&
        event.pointerId === interactiveGuard.pointerId
      ) {
        const guard = interactiveGuard;
        const dy = event.clientY - guard.startY;
        const elapsed = Math.max(1, performance.now() - guard.startTime);
        const velocity = (guard.startY - event.clientY) / elapsed;
        const ady = Math.abs(dy);
        const pastTap = ady > TAP_TOLERANCE_PX;
        const distanceCommit = ady >= viewH() * SWIPE_COMMIT_RATIO;
        const velocityCommit = Math.abs(velocity) >= SWIPE_VELOCITY_PX_MS;

        if (
          gesturesReady &&
          guard.allowStackPromote &&
          pastTap &&
          (distanceCommit || velocityCommit)
        ) {
          const direction: 1 | -1 = dy < 0 || velocity > 0 ? 1 : -1;
          const gesture: StackSwipeGesture = {
            pointerId: guard.pointerId,
            startX: guard.startX,
            startY: guard.startY,
            startTime: guard.startTime,
            startScrollY: guard.scrollY,
            startIndex: stackStartIndex(guard.scrollY),
            committed: false,
          };
          clearInteractiveGuard();
          swipe = gesture;
          suppressClickUntil = performance.now() + 600;
          applySwipeFollow(gesture, event.clientY);
          commitSwipe(gesture, direction);
          clearSwipe();
          stackTouchActive = false;
          return;
        }

        freezeAt(guard.scrollY);
        clearInteractiveGuard();
        stackTouchActive = false;
        return;
      }

      if (!swipe || event.pointerId !== swipe.pointerId) {
        stackTouchActive = false;
        return;
      }

      if (!swipe.committed && !snapping && gesturesReady) {
        const dy = event.clientY - swipe.startY;
        const elapsed = Math.max(1, performance.now() - swipe.startTime);
        const velocity = (swipe.startY - event.clientY) / elapsed; // up = positive
        const ady = Math.abs(dy);

        const distanceCommit = ady >= viewH() * SWIPE_COMMIT_RATIO;
        const velocityCommit = Math.abs(velocity) >= SWIPE_VELOCITY_PX_MS;
        const pastTap = ady > TAP_TOLERANCE_PX;

        if (pastTap && (distanceCommit || velocityCommit)) {
          const direction: 1 | -1 = dy < 0 || velocity > 0 ? 1 : -1;
          commitSwipe(swipe, direction);
        } else {
          // Cancel — glide back onto the card we started on.
          if (Math.abs(getScrollY() - cardScrollY(swipe.startIndex)) > 1) {
            snapToCardIndex(swipe.startIndex, {
              fromY: getScrollY(),
              ease:
                getScrollY() > cardScrollY(swipe.startIndex)
                  ? SNAP_EASE_REVERSE
                  : SNAP_EASE,
            });
          } else {
            freezeAt(swipe.startScrollY);
          }
        }
      }

      clearSwipe();
      if (!snapping) stackTouchActive = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!prefersTouch) return;

      // Footer zone: native page scroll when not mid stack gesture / settle.
      if (
        !stackTouchActive &&
        !swipe &&
        !interactiveGuard &&
        !snapping &&
        inFooterZone(getScrollY())
      ) {
        return;
      }

      // Path A only — never let native scroll scrub the card stack.
      event.preventDefault();

      if (!gesturesReady) {
        freezeAt(pinY || getScrollY());
        return;
      }

      if (swipe?.committed) {
        return;
      }
      if (snapping && !swipe) {
        return;
      }

      if (interactiveGuard) {
        const touch = event.touches[0];
        if (
          touch &&
          promoteInteractiveToSwipe(
            interactiveGuard,
            touch.clientY,
            touch.clientX,
          )
        ) {
          return;
        }
        // Block scroll when the press began on a CTA/link (tap-only).
        freezeAt(interactiveGuard.scrollY);
        return;
      }

      if (!swipe) {
        freezeAt(pinY);
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      const dy = touch.clientY - swipe.startY;
      const ady = Math.abs(dy);
      const adx = Math.abs(touch.clientX - swipe.startX);

      if (ady < SWIPE_FOLLOW_PX || ady < adx) {
        freezeAt(swipe.startScrollY);
        return;
      }

      applySwipeFollow(swipe, touch.clientY);
    };

    root.addEventListener("pointerdown", onPointerDown, { capture: true });
    root.addEventListener("pointermove", onPointerMove, { capture: true });
    root.addEventListener("pointerup", onPointerEnd, { capture: true });
    root.addEventListener("pointercancel", onPointerEnd, { capture: true });
    root.addEventListener("click", onClickCapture, { capture: true });
    root.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: false,
    });

    syncFooterZone();

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (tReady) window.clearTimeout(tReady);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("pointerdown", onPointerDown, true);
      root.removeEventListener("pointermove", onPointerMove, true);
      root.removeEventListener("pointerup", onPointerEnd, true);
      root.removeEventListener("pointercancel", onPointerEnd, true);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("touchmove", onTouchMove, true);
      snapTween?.kill();
      clearSwipe();
      clearInteractiveGuard();
      stackTouchActive = false;
      wrap.style.removeProperty("--stack-scroll-units");
      onFooterZoneChangeRef.current?.(false);
      ctx.revert();
    };
  }, [containerRef, enabled, onNavColorChange]);
}
