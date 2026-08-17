import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AutoPlayMutedVideo } from "../components/AutoPlayMutedVideo";
import GlobalNavigation from "../components/GlobalNavigation";
import { MaskedLine } from "../components/MaskedLine";
import { ScrollReveal } from "../components/ScrollReveal";
import {
  BODY_BASE_DELAY_MS,
  BODY_DURATION_MS,
  TITLE_DELAY_MS,
  TITLE_DURATION_MS,
} from "../motion/heroEntrance";
import "../App.css";
import "./StoneIslandPage.css";

/** Homepage Stone Island stacked card (`data-node-id`). */
const HOME_STONE_ISLAND_CARD_ID = "72:194";

/**
 * Flattened Figma frame exports (91:3758) — shadows / overlays / crops baked in.
 */
const assets = {
  /** Same looping reel as the Homepage Stone Island card. */
  hero: "/assets/stone-island.mp4",
  carousel: [
    "/assets/stone/carousel-01.jpg",
    "/assets/stone/carousel-02.jpg",
  ] as const,
  editorial: "/assets/stone/editorial-polo.jpg",
  layeringBg: "/assets/stone/layering-bg.jpg",
  layeringProduct: "/assets/stone/layering-product.jpg",
  collageWide: "/assets/stone/collage-wide.jpg",
  collageLeft: "/assets/stone/collage-left.jpg",
  collageRight: "/assets/stone/collage-right.jpg",
};

function PauseMark() {
  return (
    <span className="si-pause" aria-hidden="true">
      <span className="si-pause__bar" />
      <span className="si-pause__bar" />
    </span>
  );
}

function PlusMark() {
  return (
    <span className="si-plus" aria-hidden="true">
      <span className="si-plus__mark" />
    </span>
  );
}

function CloseMark() {
  const { search } = useLocation();
  return (
    <Link
      to={{ pathname: "/", search }}
      state={{ focusStackedCard: HOME_STONE_ISLAND_CARD_ID }}
      className="si-close"
      aria-label="Back to Stone Island on homepage"
    >
      <span className="si-close__x" aria-hidden="true" />
    </Link>
  );
}

/**
 * Hero title + body — masked line reveal only (image / section / bg untouched).
 * Plays once when the copy first enters the viewport.
 */
function HeroCopy() {
  const copyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = copyRef.current;
    if (!el || active) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }

    const reveal = () => setActive(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        reveal();
        observer.disconnect();
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(el);

    for (const entry of observer.takeRecords()) {
      if (entry.isIntersecting) {
        reveal();
        observer.disconnect();
        break;
      }
    }

    return () => observer.disconnect();
  }, [active]);

  return (
    <div ref={copyRef} className="si-hero__copy">
      <h1 className="si-hero__title">
        <MaskedLine
          delayMs={TITLE_DELAY_MS}
          durationMs={TITLE_DURATION_MS}
          active={active}
        >
          Stone Island x New Balance
        </MaskedLine>
      </h1>
      <p className="si-hero__body">
        <MaskedLine
          delayMs={BODY_BASE_DELAY_MS}
          durationMs={BODY_DURATION_MS}
          active={active}
        >
          Classic 99X elements reinterpreted with sculpted cushioning, expanded
          sway bars, and Y2K-inspired proportions.
        </MaskedLine>
      </p>
    </div>
  );
}

/**
 * Stone Island Collection — static layout from Figma 91:3758.
 * Below-hero content uses the shared PDP/PLP scroll reveal on inner wrappers
 * so section backgrounds stay static.
 */
export default function StoneIslandPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="si">
      <GlobalNavigation variant="homepage" color="white" />

      <main className="si__main">
        {/* 1 — Quick Collection Hero 91:3778 (h=650) — masked text only */}
        <section className="si-hero" aria-label="Stone Island x New Balance">
          <div className="si-hero__media">
            <AutoPlayMutedVideo
              className="si-hero__img"
              src={assets.hero}
              poster="/assets/stone/hero.jpg"
            />
            <PauseMark />
          </div>
          <CloseMark />
          <HeroCopy />
        </section>

        {/* 2 — Carousel / Material innovation 91:3793 (h=874) */}
        <section className="si-carousel" aria-label="Material innovation">
          <ScrollReveal as="div" className="si-carousel__reveal">
            <h2 className="si-carousel__eyebrow">Material innovation</h2>
            <div className="si-carousel__track">
              <div className="si-carousel__card">
                <img className="si-carousel__img" src={assets.carousel[0]} alt="" />
                <PauseMark />
              </div>
              <div className="si-carousel__card si-carousel__card--peek" aria-hidden="true">
                <img className="si-carousel__img" src={assets.carousel[1]} alt="" />
              </div>
            </div>
            <div className="si-carousel__meta">
              <p className="si-carousel__title">Material Study</p>
              <p className="si-carousel__desc">
                Exploring texture, utility, and shared craft.
              </p>
            </div>
            <div className="si-carousel__progress" aria-hidden="true">
              <span className="si-carousel__bar si-carousel__bar--active" />
              <span className="si-carousel__bar" />
            </div>
          </ScrollReveal>
        </section>

        {/* 3 — Editorial Grid 91:3814 (h=874) */}
        <section className="si-editorial" aria-label="Stone Island and New Balance">
          <ScrollReveal as="div" className="si-editorial__reveal">
            <div className="si-editorial__media">
              <img className="si-editorial__img" src={assets.editorial} alt="" />
              <PlusMark />
            </div>
            <div className="si-editorial__copy">
              <h2 className="si-editorial__title">Stone Island &amp; New Balance</h2>
              <p className="si-editorial__body">
                Bringing together New Balance performance and Stone Island&apos;s
                pioneering approach to design, this collection reimagines football
                culture through a modern lens.
              </p>
            </div>
          </ScrollReveal>
        </section>

        {/* 4 — Layering 91:3826 (h=874) — bg image stays static */}
        <section className="si-layering" aria-label="Tekela Elite">
          <img className="si-layering__bg" src={assets.layeringBg} alt="" />
          <ScrollReveal as="div" className="si-layering__reveal">
            <div className="si-layering__product">
              <img
                className="si-layering__product-img"
                src={assets.layeringProduct}
                alt=""
              />
              <PlusMark />
            </div>
            <div className="si-layering__meta">
              <p className="si-layering__name">
                Stone Island X New Balance Tekela Elite
              </p>
              <p className="si-layering__price">$294.99</p>
            </div>
          </ScrollReveal>
        </section>

        {/* 5 — Collection Grid 91:3834 (h=874) */}
        <section className="si-collage" aria-label="The Stone Island Collection">
          <ScrollReveal as="div" className="si-collage__reveal">
            <h2 className="si-collage__title">The Stone Island Collection</h2>
            <div className="si-collage__grid">
              <div className="si-collage__wide">
                <img className="si-collage__img" src={assets.collageWide} alt="" />
              </div>
              <div className="si-collage__half">
                <img className="si-collage__img" src={assets.collageLeft} alt="" />
              </div>
              <div className="si-collage__half">
                <img className="si-collage__img" src={assets.collageRight} alt="" />
              </div>
            </div>
            <p className="si-collage__caption">From pitch to pavement.</p>
            <div className="si-collage__ctas">
              <span className="si-collage__cta">Shop collection</span>
              <Link className="si-collage__cta" to="/global-football">
                Global Football
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
}
