import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
  /** Shown before the first decoded frame (and if autoplay is blocked). */
  poster?: string;
};

/**
 * Background reel that must autoplay on iOS Safari.
 * Relies on muted + playsInline, then force-plays when the host card
 * is on screen and again after the first user gesture (stack swipe).
 */
export function AutoPlayMutedVideo({ src, className, poster }: Props) {
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
    tryPlay();

    const onReady = () => tryPlay();
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("canplaythrough", onReady);

    const card =
      video.closest<HTMLElement>("[data-stacked-card]") ??
      video.parentElement ??
      video;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          tryPlay();
        }
      },
      { threshold: [0, 0.2, 0.5, 0.8] },
    );
    observer.observe(card);

    // Stack swipe counts as a user gesture — unlock autoplay if needed.
    const onGesture = () => tryPlay();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryPlay();
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
      poster={poster}
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
