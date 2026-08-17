import { useScrollHeader } from "../hooks/useScrollAwareHeader";
import "./PromoBar.css";

/**
 * Global Promo Bar — Figma 83:2742
 * 38px tall, white, centered 10px copy + underlined CTA.
 * Scroll-hide on non-homepage routes via ScrollHeaderProvider.
 */
export function PromoBar() {
  const { enabled, showPromoBar } = useScrollHeader();
  const hidden = enabled && !showPromoBar;

  return (
    <div
      className="promo-bar nb-fixed-shell"
      data-node-id="83:2742"
      data-header-promo={hidden ? "hidden" : "shown"}
      role="region"
      aria-label="Promotion"
      aria-hidden={hidden || undefined}
    >
      <div className="promo-bar__inner">
        <p className="promo-bar__text">Seasonal savings on select styles.</p>
        <a className="promo-bar__cta" href="#shop" tabIndex={hidden ? -1 : undefined}>
          Shop now
        </a>
      </div>
    </div>
  );
}
