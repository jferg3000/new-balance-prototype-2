import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AutoPlayMutedVideo } from "../components/AutoPlayMutedVideo";
import { Footer } from "../components/Footer";
import {
  IconBag,
  IconLogo,
  IconMenu,
  IconSearch,
} from "../components/navIcons";
import { PEEP_CARDS, useHeroIntro } from "../hooks/useHeroIntro";
import { useStackedSections } from "../hooks/useStackedSections";
import "../App.css";

/** Homepage entry via react-router location.state */
export type HomeEntryState = {
  /** `data-node-id` of a stacked card to open on (skips intro). */
  focusStackedCard?: string;
};

const assets = {
  hero: "/assets/hero.jpg",
  sezane: "/assets/sezane.jpg",
  // Faststarted H.264 (moov before mdat) — required for iOS progressive autoplay.
  utility: "/assets/stone-island.mp4",
  product: "/assets/product.jpg",
  backToSchool: "/assets/back-to-school.jpg",
};

function SiteNav({
  color,
  footerHidden,
}: {
  color: "white" | "black";
  footerHidden: boolean;
}) {
  return (
    <header
      className="site-nav site-nav--cube nb-fixed-shell"
      data-nav-color={color}
      data-footer-hidden={footerHidden ? "true" : undefined}
    >
      {/*
        3D cube entrance: perspective → cube (animated rotateX) → face
        (nav texture on the cube front; starts as top face at rotateX -90).
      */}
      <div className="site-nav__perspective">
        <div className="site-nav__cube" data-hero-enter="nav">
          <div className="site-nav__face" data-nav-face>
            <div className="nav">
              <button type="button" className="nav__menu" aria-label="Menu">
                <IconMenu tone={color} />
              </button>
              <Link to="/" className="nav__logo" aria-label="New Balance home">
                <IconLogo tone={color} />
              </Link>
              <div className="nav__actions">
                <button type="button" aria-label="Search">
                  <IconSearch tone={color} />
                </button>
                <button type="button" aria-label="Bag">
                  <IconBag tone={color} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function IntroStackOverlay({
  overlayRef,
  heroCardRef,
}: {
  overlayRef: React.RefObject<HTMLDivElement | null>;
  heroCardRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="intro-stack nb-fixed-shell"
      ref={overlayRef}
      data-visible="true"
      data-peep-intro="true"
      aria-hidden="true"
    >
      <div className="intro-stack__stage" data-intro-stage>
        <div className="intro-stack__compose" data-intro-compose>
          {PEEP_CARDS.map((card, index) => {
            const isHero = card.id === "hero";
            return (
              <div
                key={card.id}
                className={`intro-card${isHero ? " intro-card--hero" : " intro-card--peep"}`}
                data-intro-card={card.id}
                data-intro-index={index}
                ref={isHero ? heroCardRef : undefined}
                style={{ zIndex: card.zIndex }}
              >
                <img
                  className={isHero ? "hero-photo" : undefined}
                  src={card.image}
                  alt=""
                />
                {isHero ? <div className="section__scrim" /> : null}
                {!isHero ? (
                  <div className="intro-card__dim" data-peep-dim aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const focusStackedCard =
    (location.state as HomeEntryState | null)?.focusStackedCard ?? null;
  const skipIntro = Boolean(focusStackedCard);

  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [stackReady, setStackReady] = useState(skipIntro);
  const [introComplete, setIntroComplete] = useState(skipIntro);
  const [navColor, setNavColor] = useState<"white" | "black">("white");
  const [navFooterHidden, setNavFooterHidden] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    setStackReady(true);
  }, []);

  const handleNavColorChange = useCallback((color: "white" | "black") => {
    setNavColor(color);
  }, []);

  const handleFooterZoneChange = useCallback((inFooter: boolean) => {
    setNavFooterHidden(inFooter);
  }, []);

  const handleFocusCardApplied = useCallback(() => {
    navigate(".", { replace: true, state: {} });
  }, [navigate]);

  useHeroIntro({
    stageRef,
    overlayRef,
    heroCardRef,
    onComplete: handleIntroComplete,
    skipIntro,
  });

  // Safety: enable stack even if intro callback is missed (HMR / reduced path)
  useEffect(() => {
    const id = window.setTimeout(() => {
      setIntroComplete(true);
      setStackReady(true);
    }, 5000);
    return () => window.clearTimeout(id);
  }, []);

  useStackedSections({
    containerRef: stageRef,
    enabled: stackReady,
    onNavColorChange: handleNavColorChange,
    onFooterZoneChange: handleFooterZoneChange,
    focusCardNodeId: focusStackedCard,
    onFocusCardApplied: handleFocusCardApplied,
  });

  return (
    <div
      className="page"
      ref={stageRef}
      data-state={introComplete ? "ready" : "intro"}
      data-stack-ready={stackReady ? "true" : "false"}
    >
      <IntroStackOverlay overlayRef={overlayRef} heroCardRef={heroCardRef} />

      <SiteNav color={navColor} footerHidden={navFooterHidden} />

      {/*
        Figma Scroll 72:381 stack order:
        Made → Sezane → Stone → 9060 Drop → Back to school
        (Footer sits in normal flow below the stack; AppLayout skips it on /)
      */}
      <main className="stacked-sections page__main">
        <div className="stack-wrap" data-stack-wrap>
          <div className="stack-stage" data-stack-stage>
            {/* 1. Made — Figma 72:254 / Hero Final 72:284 */}
            <section
              className="stacked-section section section--hero"
              data-stacked-card
              data-nav-color="white"
              data-node-id="72:254"
            >
              <div className="section__media section__media--bleed">
                <img className="hero-photo" src={assets.hero} alt="" />
                <div className="section__scrim" />
              </div>
              <div className="section__copy section__copy--light section__copy--hero">
                <h1
                  className="section__title section__title--hero"
                  data-hero-enter="copy"
                >
                  Made in <span className="section__title-u">U</span>SA
                </h1>
                <p className="section__subtitle" data-hero-enter="copy">
                  Crafted with purpose. Worn with intention.
                </p>
                <div className="section__ctas" data-hero-enter="copy">
                  <a className="section__cta" href="#shop">
                    Shop now
                  </a>
                </div>
              </div>
            </section>

            {/* 2. Sezane — desktop 146:422; mobile Figma 147:649 (402×874) */}
            <section
              className="stacked-section section section--editorial"
              data-stacked-card
              data-nav-color="black"
              data-node-id="147:649"
            >
              <div className="section__media section__media--inset">
                <img src={assets.sezane} alt="Sezane x New Balance" />
              </div>
              <div className="section__copy section__copy--dark section__copy--editorial">
                <h2 className="section__title">
                  Sezane x New Balance
                </h2>
                <p className="section__subtitle section__subtitle--editorial-desktop">
                  New Balance craft meets Sézane sensibility.
                </p>
                <p className="section__subtitle section__subtitle--editorial-mobile">
                  New Balance craft meets Sézane sensibility.
                </p>
                <a className="section__cta" href="#shop">
                  Shop now
                </a>
              </div>
            </section>

            {/* 3. Stone — Figma 72:194 */}
            <section
              className="stacked-section section section--utility"
              data-stacked-card
              data-nav-color="white"
              data-node-id="72:194"
            >
              <div className="section__media section__media--bleed">
                <AutoPlayMutedVideo
                  className="section__photo"
                  src={assets.utility}
                />
              </div>
              <div className="section__copy section__copy--light section__copy--hero">
                <h2 className="section__title">Utility, reimagined</h2>
                <p className="section__subtitle">
                  Engineered for the game, worn well beyond it.
                </p>
                <span className="section__cta" aria-disabled="true">
                  Explore the Stone Island collection
                </span>
              </div>
            </section>

            {/* 4. 9060 Drop — Figma 147:713 (402×874) */}
            <section
              className="stacked-section section section--product"
              data-stacked-card
              data-nav-color="black"
              data-node-id="147:713"
            >
              <div className="section__inner section__inner--product">
                <div className="section__media section__media--product">
                  <img
                    src={assets.product}
                    alt="New Balance 9060"
                  />
                </div>
                <div className="section__copy section__copy--dark section__copy--product">
                  <Link
                    className="section__product-hit"
                    to="/9060-plp"
                    state={{ fromHomepage: true }}
                    data-no-stack-gesture
                  >
                    <h2 className="section__title">A classic, reimagined</h2>
                    <p className="section__subtitle">
                      Heritage you recognize, attitude you don't.
                    </p>
                    <span className="section__cta">Shop 9060</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* 5. Back to school — Figma 72:131 */}
            <section
              className="stacked-section section section--bts"
              data-stacked-card
              data-nav-color="white"
              data-node-id="72:131"
            >
              <div className="section__media section__media--bleed">
                <img src={assets.backToSchool} alt="" />
              </div>
              <div className="section__copy section__copy--light section__copy--hero">
                <h2 className="section__title section__title--hero">
                  Back to school
                </h2>
                <p className="section__subtitle">
                  Made to keep up from first bell to last.
                </p>
                <a className="section__cta" href="#shop">
                  Shop now
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Normal document-flow footer below the final stacked card */}
        <Footer />
      </main>
    </div>
  );
}
