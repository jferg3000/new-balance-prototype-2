import type { PdpProduct } from "../../data/pdpProducts";
import { usePdpEnter } from "../../hooks/usePdpMotion";

type PdpHeroProps = {
  product: PdpProduct;
};

/**
 * Figma 108:731 — 9060 - Hero
 * Title, Shoe Angles gallery, indicator/reviews.
 * Buy pack CTA lives in PdpStickyAddToBag at the page shell (always fixed).
 */
export default function PdpHero({ product }: PdpHeroProps) {
  const enterRef = usePdpEnter<HTMLElement>();

  return (
    <section
      ref={enterRef}
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
        <div className="pdp-hero__slide">
          <img className="pdp-hero__img" src={product.images.hero} alt="" />
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
  );
}
