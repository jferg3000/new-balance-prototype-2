import { useEffect, useRef, useState } from "react";
import { usePdpRevealOnce } from "../../hooks/usePdpMotion";

type PdpDefineYourStyleProps = {
  /** Optional poster while the video loads. */
  posterSrc?: string;
  videoSrc?: string;
};

const DEFAULT_VIDEO = "/assets/pdp/editorial/define-your-style.mp4";
const PLAY_ICON = "/assets/pdp/ui/icon-video-play.svg";
const PAUSE_ICON = "/assets/pdp/ui/icon-video-pause.svg";

/** Figma 108:563 — Define your style editorial module (scroll-triggered video). */
export default function PdpDefineYourStyle({
  posterSrc,
  videoSrc,
}: PdpDefineYourStyleProps) {
  // Empty string = intentional WIP placeholder (do not fall back to default video).
  const resolvedVideoSrc = videoSrc === undefined ? DEFAULT_VIDEO : videoSrc;
  const revealRef = usePdpRevealOnce<HTMLElement>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** User paused while in view — cleared when the video leaves the viewport. */
  const userPausedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedVideoSrc) return;

    const syncPlaying = () => setIsPlaying(!video.paused);
    video.addEventListener("play", syncPlaying);
    video.addEventListener("pause", syncPlaying);
    syncPlaying();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          if (userPausedRef.current) return;
          const play = video.play();
          if (play !== undefined) {
            play.catch(() => {
              /* Autoplay can be blocked; muted + playsInline usually ok. */
            });
          }
        } else {
          userPausedRef.current = false;
          video.pause();
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.35 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.removeEventListener("play", syncPlaying);
      video.removeEventListener("pause", syncPlaying);
    };
  }, [resolvedVideoSrc]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      const play = video.play();
      if (play !== undefined) {
        play.catch(() => {
          /* Ignore abort / autoplay race. */
        });
      }
      return;
    }

    userPausedRef.current = true;
    video.pause();
  };

  return (
    <section
      ref={revealRef}
      className="pdp-style pdp-reveal-section"
      data-node-id="161:409"
      aria-label="Define your style"
    >
      <div className="pdp-style__media">
        {resolvedVideoSrc ? (
          <>
            <video
              ref={videoRef}
              className="pdp-style__video"
              src={resolvedVideoSrc}
              poster={posterSrc}
              muted
              playsInline
              loop
              preload="metadata"
              aria-label="Define your style"
            />
            <button
              type="button"
              className="pdp-style__playback"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              onClick={togglePlayback}
            >
              <img
                className="pdp-style__playback-icon"
                src={PAUSE_ICON}
                alt=""
                width={35}
                height={35}
                data-active={isPlaying ? "true" : undefined}
                aria-hidden="true"
              />
              <img
                className="pdp-style__playback-icon"
                src={PLAY_ICON}
                alt=""
                width={35}
                height={35}
                data-active={isPlaying ? undefined : "true"}
                aria-hidden="true"
              />
            </button>
          </>
        ) : null}
      </div>
      <div className="pdp-style__text">
        <h2 className="pdp-style__title">Define your style</h2>
        <p className="pdp-style__copy">
          The 9060 is built for casual style. Explore more shoes and clothing
          built for lifestyle
        </p>
        <a className="pdp-style__link" href="#lifestyle">
          Explore all lifestyle
        </a>
      </div>
    </section>
  );
}
