import type { PdpProduct } from "../../data/pdpProducts";
import { useHeroParallax } from "../../hooks/useHeroParallax";
import { usePdpEnter } from "../../hooks/usePdpMotion";

type PdpHeroProps = {
  product: PdpProduct;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Figma 108:731 — 9060 - Hero
 * Title, Shoe Angles gallery, indicator/reviews.
 * Buy pack CTA lives in PdpStickyAddToBag at the page shell (always fixed).
 *
 * Sticky + shoe parallax matches new-balance-prototype-1 motion-study-1:
 * pin at z-1, next modules slide over at z-3, shoe drifts ~44px and fades.
 */
export default function PdpHero({ product }: PdpHeroProps) {
  const enterRef = usePdpEnter<HTMLElement>();
  const reduced = prefersReducedMotion();
  const { panelRef, stickyRef, shoeY, shoeOpacity } = useHeroParallax(!reduced);

  const setHeroNode = (node: HTMLElement | null) => {
    enterRef.current = node;
    stickyRef.current = node;
  };

  return (
    <>
      {/*
        Zero-height sentinel for parallax progress. Sticky panel must NOT sit
        in a same-height wrapper — that kills sticky.
      */}
      <div
        ref={panelRef}
        className="pdp-hero-sentinel"
        aria-hidden
      />
      <section
        ref={setHeroNode}
        className="pdp-hero"
        aria-label="Product overview"
      >
        <div className="pdp-hero__title">
          <div className="pdp-hero__identity">
            <h1 className="pdp-hero__name">{product.name}</h1>
            <p className="pdp-hero__price">{product.price}</p>
          </div>
          <p className="pdp-hero__tagline">{product.tagline}</p>
        </div>

        <div className="pdp-hero__gallery" aria-label="Product images">
          <div
            className="pdp-hero__parallax"
            style={{
              transform: shoeY ? `translate3d(0, ${shoeY}px, 0)` : undefined,
              opacity: reduced ? undefined : shoeOpacity,
            }}
          >
            <div className="pdp-hero__slide">
              <img className="pdp-hero__img" src={product.images.hero} alt="" />
            </div>
          </div>
        </div>

        <div className="pdp-hero__meta">
          <div className="pdp-hero__indicator" aria-hidden="true">
            <span className="pdp-hero__indicator-active" />
            <span className="pdp-hero__indicator-rest" />
          </div>
          <div className="pdp-hero__reviews">
            <img
              className="pdp-hero__star"
              src="/assets/pdp/ui/icon-star.svg"
              alt=""
            />
            <span className="pdp-hero__rating">{product.rating}</span>
            <span className="pdp-hero__count">{product.reviewCount}</span>
          </div>
        </div>
      </section>
    </>
  );
}
