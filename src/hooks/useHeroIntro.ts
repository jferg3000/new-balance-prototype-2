import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
// Soft settle — cubic-bezier(0.16, 1, 0.3, 1)
CustomEase.create("navCubeReveal", "M0,0 C0.16,1 0.3,1 1,1");

/** Promo — fade in place after Hero settles (no translate). */
const PROMO_REVEAL_DURATION = 0.55; // 550ms
const PROMO_REVEAL_EASE = "power2.out";

/** Nav cube — rotate the 3D wrapper (not a flat plane). Keep buttery timing. */
const NAV_REVEAL_DURATION = 1.6; // 1600ms — slower settle into place
const NAV_REVEAL_EASE = "navCubeReveal";
/**
 * Front face sits at translateZ(navHeight/2). Sign flip test only:
 * opposite of prior -90° → +90° → 0°.
 */
const NAV_CUBE_START_ROTATE_X = 90;

/**
 * First-card copy group starts when nav cube is ~30% through.
 * Internal title→subtitle→CTA stagger is unchanged.
 */
const COPY_AFTER_NAV_PROGRESS = 0.3;

type IntroRefs = {
  stageRef: React.RefObject<HTMLElement | null>;
  overlayRef: React.RefObject<HTMLElement | null>;
  heroCardRef: React.RefObject<HTMLElement | null>;
  onComplete?: () => void;
  /** Skip cinematic intro (e.g. returning to a deep-linked stacked card). */
  skipIntro?: boolean;
};

/** Shared hero asset — identical for Intro cover + Hero Final */
export const HERO_IMAGE = "/assets/hero.jpg";

/**
 * One Peep — two boards only.
 * Front = Made / Final Hero; back = next section (Sezane) with dim overlay.
 */
export const PEEP_CARDS = [
  { id: "hero", image: "/assets/hero.jpg", zIndex: 2 },
  // Matches Intro Stack peep + homepage section beneath Made
  { id: "sezane", image: "/assets/sezane.jpg", zIndex: 1 },
] as const;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readFrameMaxPx() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nb-frame-max")
    .trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 440;
}

/** Convert a viewport rect into coordinates local to the intro overlay. */
function overlayLocalRect(
  overlay: HTMLElement,
  r: DOMRect,
): { left: number; top: number; width: number; height: number } {
  const o = overlay.getBoundingClientRect();
  return {
    left: r.left - o.left,
    top: r.top - o.top,
    width: r.width,
    height: r.height,
  };
}

function revealPage(
  stage: HTMLElement,
  overlay: HTMLElement,
  onRevealed?: () => void,
  options?: { resetScroll?: boolean },
) {
  // Keep black under the handoff — never flash white page chrome
  document.body.style.background = "#000";
  stage.style.background = "#000";
  // Returning to a deep-linked stacked card must not wipe its scroll position.
  if (options?.resetScroll !== false) {
    window.scrollTo(0, 0);
  }

  // Enable the real hero + stack WHILE the intro overlay still covers the page,
  // so white sections never paint for a frame.
  stage.dataset.state = "ready";
  onRevealed?.();

  const hideOverlay = () => {
    // After stackReady / --stack-view-h commit, snap intro front to the live
    // hero media box so the fade cannot reveal a size/crop correction.
    const heroMedia = stage.querySelector<HTMLElement>(
      ".section--hero .section__media--bleed",
    );
    const introFront = overlay.querySelector<HTMLElement>(
      '[data-intro-card="hero"]',
    );
    if (heroMedia && introFront) {
      const r = heroMedia.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) {
        const local = overlayLocalRect(overlay, r);
        gsap.set(introFront, {
          left: local.left,
          top: local.top,
          width: local.width,
          height: local.height,
          x: 0,
          y: 0,
          scale: 1,
        });
      }
    }

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.1,
      ease: "none",
      onComplete: () => {
        overlay.dataset.visible = "false";
        gsap.set(overlay, { clearProps: "opacity" });
        overlay
          .querySelectorAll<HTMLElement>(
            "[data-intro-card], [data-intro-compose], [data-intro-group]",
          )
          .forEach((el) => {
            gsap.set(el, { clearProps: "all" });
          });

        document.body.style.background = "";
        stage.style.background = "";
      },
    });
  };

  // Wait for React to commit stackReady + ScrollTrigger to park under-cards
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(hideOverlay);
    });
  });
}

/**
 * One Peep intro: hold Intro Stack, then scale both cards together
 * into Final Hero + next section handoff.
 */
export function useHeroIntro({
  stageRef,
  overlayRef,
  heroCardRef,
  onComplete,
  skipIntro = false,
}: IntroRefs) {
  const playedRef = useRef(false);
  const handedOffRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Lock before paint so Promo Bar never flashes above the cinematic intro.
  useLayoutEffect(() => {
    if (skipIntro) return;
    document.body.classList.add("is-intro-locked");
    return () => {
      document.body.classList.remove("is-intro-locked");
    };
  }, [skipIntro]);

  useEffect(() => {
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    const heroCard = heroCardRef.current;
    if (!stage || !overlay || !heroCard) return;

    const front = overlay.querySelector<HTMLElement>(
      '[data-intro-card="hero"]',
    );
    const back = overlay.querySelector<HTMLElement>(
      '[data-intro-card="sezane"]',
    );
    const compose = overlay.querySelector<HTMLElement>("[data-intro-compose]");
    const overlayDim = back?.querySelector<HTMLElement>("[data-peep-dim]");

    const navCube = stage.querySelector<HTMLElement>('[data-hero-enter="nav"]');
    const navFace = stage.querySelector<HTMLElement>("[data-nav-face]");
    const navShell = stage.querySelector<HTMLElement>(".site-nav--cube");
    const promo = document.querySelector<HTMLElement>(".promo-bar");
    const copyEls = stage.querySelectorAll<HTMLElement>(
      '[data-hero-enter="copy"]',
    );

    const navDepthPx = () => {
      const h =
        navFace?.offsetHeight ||
        navShell?.querySelector<HTMLElement>(".site-nav__perspective")
          ?.offsetHeight ||
        0;
      if (h > 0) return h / 2;
      const token = getComputedStyle(document.documentElement)
        .getPropertyValue("--nav-height")
        .trim();
      const parsed = Number.parseFloat(token);
      return (Number.isFinite(parsed) ? parsed : 54) / 2;
    };

    const settleNavCube = () => {
      // Tween already ends at identity (rotateX 0, z 0) — clear only, no snap.
      if (navCube) gsap.set(navCube, { clearProps: "transform,rotateX" });
      if (navFace) {
        gsap.set(navFace, { clearProps: "transform,opacity,z", opacity: 1 });
      }
      navShell?.classList.add("is-nav-settled");
    };

    const hideChrome = () => {
      // Promo: opacity only — final layout position already set (no y/slide).
      if (promo) gsap.set(promo, { opacity: 0, y: 0 });
      navShell?.classList.remove("is-nav-settled");
      const depth = navDepthPx();
      // Cube: park FRONT face as TOP face; face sits at +Z for cube depth.
      if (navCube) {
        gsap.set(navCube, {
          rotateX: NAV_CUBE_START_ROTATE_X,
          transformOrigin: "50% 50%",
          force3D: true,
        });
      }
      if (navFace) {
        gsap.set(navFace, {
          opacity: 0,
          z: depth,
          force3D: true,
        });
      }
      if (copyEls.length) gsap.set(copyEls, { opacity: 0 });
    };

    const showUiImmediate = () => {
      document.body.classList.remove("is-intro-locked");
      if (promo) gsap.set(promo, { clearProps: "opacity,y", opacity: 1 });
      settleNavCube();
      if (copyEls.length) gsap.set(copyEls, { clearProps: "all", opacity: 1 });
    };

    const notifyComplete = () => onCompleteRef.current?.();

    const finishWithoutMotion = (resetScroll = true) => {
      // Already handed off — do not re-run reveal (would scrollTo(0) and fight
      // deep-linked stacked-card focus after location.state is cleared).
      if (handedOffRef.current) {
        showUiImmediate();
        notifyComplete();
        return;
      }
      handedOffRef.current = true;
      playedRef.current = true;
      revealPage(
        stage,
        overlay,
        () => {
          showUiImmediate();
          notifyComplete();
        },
        { resetScroll },
      );
    };

    const params = new URLSearchParams(window.location.search);
    const holdIntro = params.has("hold");

    if (skipIntro && !holdIntro) {
      finishWithoutMotion(false);
      return;
    }

    if (prefersReducedMotion() && !holdIntro) {
      finishWithoutMotion();
      return;
    }

    if (!front || !back || !compose) {
      finishWithoutMotion();
      return;
    }

    if (playedRef.current && !holdIntro) {
      finishWithoutMotion();
      return;
    }

    let finished = false;
    document.body.classList.add("is-intro-locked");
    stage.dataset.state = "intro";
    overlay.dataset.visible = "true";
    gsap.set(overlay, { opacity: 1 });
    window.scrollTo(0, 0);

    hideChrome();
    if (overlayDim) gsap.set(overlayDim, { opacity: 1 });

    // Intro Stack geometry from Figma 72:314 (402×874), % of the 440 shell.
    // Front 72:363 — 42,106 322×644
    // Back  81:1215 — aligned width with front; y so lower portion peeks
    const vw = () => {
      const shell = document.querySelector<HTMLElement>(".nb-shell");
      const shellW = shell?.getBoundingClientRect().width ?? 0;
      if (shellW > 1) return shellW;
      const overlayW = overlay.getBoundingClientRect().width;
      if (overlayW > 1) return overlayW;
      return Math.min(window.innerWidth, readFrameMaxPx());
    };
    /** Desktop / expand end — unchanged layout viewport. */
    const vh = () => window.innerHeight;
    /**
     * Mobile intro composition uses the visible viewport. With Safari URL bar +
     * toolbar kept exposed, `innerHeight` can outrun what the user sees, so the
     * peep is laid out (and clipped) under the chrome.
     */
    const isMobileIntro = () =>
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    const introVh = () => {
      if (!isMobileIntro()) return vh();
      const visualH = window.visualViewport?.height;
      return visualH && visualH > 0 ? visualH : vh();
    };

    const introFront = () => {
      const viewH = introVh();
      const w = Math.min(vw() * (322 / 402), vw() * 0.8);
      const h = w * (644 / 322);
      const left = (vw() - w) / 2;
      // Keep stack within the intro viewport with a visible peep below
      const top = Math.max(
        viewH * (106 / 874),
        (viewH - h - Math.min(viewH * 0.14, 120)) / 2,
      );
      return { left, top, width: w, height: h };
    };

    // Back is smaller (Figma 81:1215 ≈ 275×445 vs front 322×644),
    // centered under the front so only its upper edge tucks behind.
    const layoutIntro = () => {
      let f = introFront();
      let bW = f.width * (275 / 322);
      let bH = bW * (445 / 275);
      let overlap = f.height * 0.04;
      let b = {
        left: f.left + (f.width - bW) / 2,
        top: f.top + f.height - overlap,
        width: bW,
        height: bH,
      };

      // Mobile-only: guarantee ~40–80px of the second card peeks in-view.
      // Desktop keeps the original Figma-derived stack.
      if (isMobileIntro()) {
        const viewH = introVh();
        const peekTarget = Math.min(80, Math.max(40, viewH * 0.075));
        let peek = viewH - b.top;
        if (peek < peekTarget) {
          const deficit = peekTarget - peek;
          // 1) Shift the stack up (tighten top inset before shrinking).
          const minTop = Math.max(8, viewH * 0.06);
          const shiftUp = Math.min(deficit, Math.max(0, f.top - minTop));
          f = { ...f, top: f.top - shiftUp };
          peek = viewH - (f.top + f.height - overlap);

          // 2) If still short, scale the front down slightly (aspect kept).
          if (peek < peekTarget) {
            const shrink = peekTarget - peek;
            const newH = Math.max(f.height - shrink, viewH * 0.55);
            const newW = newH * (322 / 644);
            f = {
              left: (vw() - newW) / 2,
              top: f.top,
              width: newW,
              height: newH,
            };
          }

          overlap = f.height * 0.04;
          bW = f.width * (275 / 322);
          bH = bW * (445 / 275);
          b = {
            left: f.left + (f.width - bW) / 2,
            top: f.top + f.height - overlap,
            width: bW,
            height: bH,
          };
        }
      }

      return { f, b };
    };

    /**
     * Final Made hero geometry — must match `.stack-stage` / ready `.page`
     * (`100svh`), NOT `window.innerHeight` / intro `100dvh`.
     */
    const measureHeroEnd = () => {
      const media = stage.querySelector<HTMLElement>(
        ".section--hero .section__media--bleed",
      );
      if (media) {
        const r = media.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) {
          return overlayLocalRect(overlay, r);
        }
      }
      const o = overlay.getBoundingClientRect();
      if (o.width > 1) {
        return { left: 0, top: 0, width: o.width, height: o.height || vh() };
      }
      return { left: 0, top: 0, width: vw(), height: vh() };
    };

    /** Uniform FLIP invert: hero-sized frame visually parked on a peep rect. */
    const flipFromPeep = (
      peep: { left: number; top: number; width: number; height: number },
      endRect: { left: number; top: number; width: number; height: number },
    ) => {
      const peepCx = peep.left + peep.width / 2;
      const peepCy = peep.top + peep.height / 2;
      const endCx = endRect.left + endRect.width / 2;
      const endCy = endRect.top + endRect.height / 2;
      return {
        x: peepCx - endCx,
        y: peepCy - endCy,
        scale: Math.min(
          peep.width / endRect.width,
          peep.height / endRect.height,
        ),
      };
    };

    const { f: f0, b: b0 } = layoutIntro();
    const end0 = measureHeroEnd();
    const endBack0 = {
      left: end0.left,
      top: end0.top + end0.height,
      width: end0.width,
      height: end0.height,
    };
    const frontFlipBase = flipFromPeep(f0, end0);
    const backFlipBase = flipFromPeep(b0, endBack0);

    // Mobile landing only: both cards +7% uniform scale; back also lifts for overlap.
    // Desktop landing left as-is. Aspect/layout boxes unchanged — transform only.
    const frontFlip0 = isMobileIntro()
      ? {
          x: frontFlipBase.x,
          y: frontFlipBase.y,
          scale: frontFlipBase.scale * 1.07,
        }
      : frontFlipBase;

    const backFlip0 = isMobileIntro()
      ? {
          x: backFlipBase.x,
          y: backFlipBase.y - 20, // close gap under the (now shorter) front card
          scale: backFlipBase.scale * 1.04 * 1.07, // prior mobile nudge × shared +7%
        }
      : {
          x: backFlipBase.x,
          y: backFlipBase.y,
          scale: backFlipBase.scale * 1.025,
        };

    gsap.set(compose, {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      x: 0,
      y: 0,
      scale: 1,
      transformOrigin: "center center",
    });

    // Landing == animation-start: lock Hero aspect + FLIP invert immediately so
    // expand onStart never swaps width/height (that was the pre-motion narrow jump).
    gsap.set(front, {
      position: "absolute",
      left: end0.left,
      top: end0.top,
      width: end0.width,
      height: end0.height,
      x: frontFlip0.x,
      y: frontFlip0.y,
      scale: frontFlip0.scale,
      zIndex: 2,
      transformOrigin: "center center",
      force3D: true,
    });

    gsap.set(back, {
      position: "absolute",
      left: endBack0.left,
      top: endBack0.top,
      width: endBack0.width,
      height: endBack0.height,
      x: backFlip0.x,
      y: backFlip0.y,
      scale: backFlip0.scale,
      zIndex: 1,
      transformOrigin: "center center",
      force3D: true,
    });

    if (holdIntro) {
      return () => {
        document.body.classList.remove("is-intro-locked");
      };
    }

    const HOLD = 1.0;
    const T_EXPAND = 1.1;

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
    });

    // Hold Intro Stack so the composition can register
    tl.to({}, { duration: HOLD });

    const expandAt = HOLD;
    const handoffAt = expandAt + T_EXPAND;

    // Transform-only expand from the already-locked landing FLIP → identity Hero.
    const progress = { t: 0 };
    const expand = {
      fX0: frontFlip0.x,
      fY0: frontFlip0.y,
      fS0: frontFlip0.scale,
      bX0: backFlip0.x,
      bY0: backFlip0.y,
      bS0: backFlip0.scale,
      endL: end0.left,
      endT: end0.top,
      endW: end0.width,
      endH: end0.height,
    };

    tl.to(
      progress,
      {
        t: 1,
        duration: T_EXPAND,
        ease: "power3.inOut",
        onStart: () => {
          // Re-assert the same locked geometry + start transform (no ratio change).
          gsap.set(front, {
            left: expand.endL,
            top: expand.endT,
            width: expand.endW,
            height: expand.endH,
            x: expand.fX0,
            y: expand.fY0,
            scale: expand.fS0,
            transformOrigin: "center center",
            force3D: true,
          });
          gsap.set(back, {
            left: expand.endL,
            top: expand.endT + expand.endH,
            width: expand.endW,
            height: expand.endH,
            x: expand.bX0,
            y: expand.bY0,
            scale: expand.bS0,
            transformOrigin: "center center",
            force3D: true,
          });
        },
        onUpdate: () => {
          const p = progress.t;
          const { fX0, fY0, fS0, bX0, bY0, bS0 } = expand;

          gsap.set(front, {
            x: fX0 * (1 - p),
            y: fY0 * (1 - p),
            scale: fS0 + (1 - fS0) * p,
            force3D: true,
          });
          gsap.set(back, {
            x: bX0 * (1 - p),
            y: bY0 * (1 - p),
            scale: bS0 + (1 - bS0) * p,
            force3D: true,
          });
        },
        onComplete: () => {
          const { endL, endT, endW, endH } = expand;
          gsap.set(front, {
            left: endL,
            top: endT,
            width: endW,
            height: endH,
            x: 0,
            y: 0,
            scale: 1,
            force3D: true,
          });
          gsap.set(back, {
            left: endL,
            top: endT + endH,
            width: endW,
            height: endH,
            x: 0,
            y: 0,
            scale: 1,
            force3D: true,
          });
        },
      },
      expandAt,
    );

    // Dim stays attached through the move; ease out near handoff
    if (overlayDim) {
      tl.to(
        overlayDim,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
        },
        expandAt + T_EXPAND - 0.35,
      );
    }

    tl.add(() => {
      finished = true;
      playedRef.current = true;
      // Lift the CSS lock so GSAP can fade chrome in with the hero settle.
      document.body.classList.remove("is-intro-locked");

      // Ready scrollport is 100svh (intro page is 100dvh). Switch under the
      // overlay and pin the intro frame to the true resting hero before fade.
      stage.dataset.state = "ready";
      void stage.clientHeight;
      const end = measureHeroEnd();
      gsap.set(front, {
        left: end.left,
        top: end.top,
        width: end.width,
        height: end.height,
        x: 0,
        y: 0,
        scale: 1,
      });
      gsap.set(back, {
        left: end.left,
        top: end.top + end.height,
        width: end.width,
        height: end.height,
        x: 0,
        y: 0,
        scale: 1,
      });

      revealPage(stage, overlay, notifyComplete);
    }, handoffAt);

    if (promo) {
      tl.to(
        promo,
        {
          opacity: 1,
          duration: PROMO_REVEAL_DURATION,
          ease: PROMO_REVEAL_EASE,
          onComplete: () => {
            gsap.set(promo, { clearProps: "opacity" });
          },
        },
        handoffAt,
      );
    }

    if (navCube) {
      // Rotate the cube body; nav texture stays fixed on the front face.
      tl.to(
        navCube,
        {
          rotateX: 0,
          duration: NAV_REVEAL_DURATION,
          ease: NAV_REVEAL_EASE,
          force3D: true,
        },
        handoffAt,
      );
    }
    if (navFace) {
      // Ease Z → 0 with the rotation so the last frame == flat resting nav
      // (no perspective “pop” when clearing translateZ after the tween).
      tl.to(
        navFace,
        {
          opacity: 1,
          z: 0,
          duration: NAV_REVEAL_DURATION,
          ease: NAV_REVEAL_EASE,
          force3D: true,
          onComplete: settleNavCube,
        },
        handoffAt,
      );
    } else if (navCube) {
      tl.add(settleNavCube, handoffAt + NAV_REVEAL_DURATION);
    }

    if (copyEls.length) {
      tl.to(
        copyEls,
        {
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        },
        handoffAt + NAV_REVEAL_DURATION * COPY_AFTER_NAV_PROGRESS,
      );
    }

    return () => {
      tl.kill();
      document.body.classList.remove("is-intro-locked");
      document.body.style.background = "";
      if (promo) gsap.set(promo, { clearProps: "opacity,y" });
      if (navCube) gsap.set(navCube, { clearProps: "transform,rotateX" });
      if (navFace) gsap.set(navFace, { clearProps: "transform,opacity,z" });
      if (!finished) {
        playedRef.current = false;
        navShell?.classList.remove("is-nav-settled");
      }
    };
  }, [stageRef, overlayRef, heroCardRef, skipIntro]);
}
