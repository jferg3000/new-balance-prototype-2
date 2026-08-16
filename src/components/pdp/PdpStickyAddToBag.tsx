import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { PdpProduct } from "../../data/pdpProducts";
import useGlobalFooterInView from "../../hooks/useGlobalFooterInView";
import type { PdpStickyAtcMode } from "../../hooks/usePdpStickyAtcMode";
import { pdpStickyAtcMotionStyle } from "./pdpStickyAtcMotion";

type PdpStickyAddToBagProps = {
  product: PdpProduct;
  mode: PdpStickyAtcMode;
};

const DEFAULT_SWATCH =
  "linear-gradient(45deg, rgb(251, 251, 251) 5.2885%, rgb(236, 234, 233) 28.365%, rgb(223, 218, 206) 39.904%, rgb(144, 99, 55) 59.135%)";

/** CTA V2 bar height — used as IO bottom rootMargin so dismiss clears before overlap. */
const FOOTER_CLEARANCE_PX = 50;

/**
 * Sole PDP Add to Bag CTA — always position:fixed at the viewport bottom.
 *
 * States (same mounted shell, CSS morph):
 * - detailed → Figma 125:1077 (color row + button)
 * - simple   → Figma 125:1074 (full-bleed black bar)
 *
 * Footer visibility temporarily slides the shell off-screen without changing mode.
 * Motion tokens: see pdpStickyAtcMotion.ts
 */
export default function PdpStickyAddToBag({
  product,
  mode,
}: PdpStickyAddToBagProps) {
  const isSimple = mode === "simple";
  const footerInView = useGlobalFooterInView(FOOTER_CLEARANCE_PX);
  const swatch = product.colorSwatch || DEFAULT_SWATCH;
  const swatchStyle = swatch.includes("gradient")
    ? { backgroundImage: swatch }
    : { background: swatch };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pdp-sticky-atc"
      data-mode={mode}
      data-footer-hidden={footerInView ? "true" : "false"}
      role="region"
      aria-label="Purchase options"
      aria-hidden={footerInView || undefined}
      style={pdpStickyAtcMotionStyle as CSSProperties}
    >
      <div className="pdp-sticky-atc__shell">
        <button
          type="button"
          className="pdp-sticky-atc__color"
          aria-label={`${product.colorName}, select color`}
          aria-disabled="true"
          tabIndex={-1}
          aria-hidden={isSimple || undefined}
          onClick={(e) => e.preventDefault()}
        >
          <span
            className="pdp-sticky-atc__swatch"
            aria-hidden="true"
            style={swatchStyle}
          />
          <span className="pdp-sticky-atc__color-name">{product.colorName}</span>
          <img
            className="pdp-sticky-atc__chevron"
            src="/assets/pdp/ui/icon-chevron.svg"
            alt=""
          />
        </button>

        <button type="button" className="pdp-sticky-atc__cta">
          <span className="pdp-sticky-atc__label pdp-sticky-atc__label--detailed">
            Add to bag
          </span>
          <span
            className="pdp-sticky-atc__label pdp-sticky-atc__label--simple"
            aria-hidden="true"
          >
            Add to bag
          </span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
