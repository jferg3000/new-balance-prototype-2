import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
};

/**
 * Background reel that must autoplay on iOS Safari.
 * Relies on muted + playsInline, then force-plays when the host card
 * is on screen and again after the first user gesture (stack swipe).
 */
export function AutoPlayMutedVideo({ src, className }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const unlockMuted = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const tryPlay = () => {
      unlockMuted();
      const play = video.play();
      if (play !== undefined) {
        play.catch(() => {
          /* Retry on next visibility / gesture. */
        });
      }
    };

    unlockMuted();
    video.load();

    const stackedCard = video.closest<HTMLElement>("[data-stacked-card]");
    const card =
      stackedCard ??
      video.parentElement ??
      video;

    const tryPlayIfLive = () => {
      if (stackedCard && stackedCard.getAttribute("data-stack-live") !== "true") {
        return;
      }
      tryPlay();
    };

    if (!stackedCard) {
      tryPlay();
    }

    const onReady = () => tryPlayIfLive();
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("canplaythrough", onReady);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          tryPlayIfLive();
        }
      },
      { threshold: [0, 0.2, 0.5, 0.8] },
    );
    if (!stackedCard) {
      observer.observe(card);
    }

    const syncStackLive = () => {
      if (!stackedCard) return;
      if (stackedCard.getAttribute("data-stack-live") === "true") {
        tryPlay();
      } else {
        video.pause();
      }
    };
    const stackAttrObserver = stackedCard
      ? new MutationObserver(syncStackLive)
      : null;
    if (stackedCard && stackAttrObserver) {
      stackAttrObserver.observe(stackedCard, {
        attributes: true,
        attributeFilter: ["data-stack-live"],
      });
      syncStackLive();
    }

    // Stack swipe counts as a user gesture — unlock autoplay if needed.
    const onGesture = () => tryPlayIfLive();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryPlayIfLive();
    };
    window.addEventListener("touchstart", onGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onGesture, {
      capture: true,
      passive: true,
    });
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      observer.disconnect();
      stackAttrObserver?.disconnect();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("canplaythrough", onReady);
      window.removeEventListener("touchstart", onGesture, true);
      window.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      controls={false}
      aria-hidden="true"
    />
  );
}
