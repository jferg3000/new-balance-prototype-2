import { usePdpRevealOnce } from "../../hooks/usePdpMotion";

type CompareSpec = { label: string; value: string };

/** Updated PDP Figma 161:794 — left-column specs (Speed row hidden in design). */
const SPECS_9060: CompareSpec[] = [
  { label: "Built for", value: "Lifestyle" },
  { label: "Best for", value: "All Day Wear" },
  { label: "Cushioning", value: "Soft" },
  { label: "Support", value: "Neutral" },
  { label: "Weight / Feel", value: "218 grams (7.7 oz)" },
  { label: "Technology", value: "Soft Fresh Foam X" },
];

const ICON_SELECT_CHEVRON = "/assets/pdp/icons/compare-select-chevron.svg";
const ICON_MODEL_CHEVRON = "/assets/pdp/icons/compare-chevron.svg";

type PdpCompareProps = {
  primaryImage: string;
  /** Optional overlay layer (Figma stacks base + overlay in the 80×80 thumb). */
  primaryOverlayImage?: string;
};

/**
 * Updated PDP — Figma 161:794 (Compare, 402×860).
 * Filters + filled 9060 column + dashed empty “Select a shoe to compare”.
 */
export default function PdpCompare({
  primaryImage,
  primaryOverlayImage,
}: PdpCompareProps) {
  const revealRef = usePdpRevealOnce<HTMLElement>();

  return (
    <section
      ref={revealRef}
      className="pdp-compare pdp-reveal-section"
      data-node-id="161:794"
      aria-label="Compare models"
    >
      <h2 className="pdp-compare__title">Find your perfect runner</h2>

      <div className="pdp-compare__filters">
        <div className="pdp-compare__filter-row">
          <p className="pdp-compare__filter-label">I need a shoe built for</p>
          <div className="pdp-compare__select">
            <span>Lifestyle</span>
            <span className="pdp-compare__select-icon" aria-hidden="true">
              <img src={ICON_SELECT_CHEVRON} alt="" />
            </span>
          </div>
        </div>
        <div className="pdp-compare__filter-row">
          <p className="pdp-compare__filter-label pdp-compare__filter-label--wrap">
            What matters most to you?
          </p>
          <div className="pdp-compare__select">
            <span>Select</span>
            <span className="pdp-compare__select-icon" aria-hidden="true">
              <img src={ICON_SELECT_CHEVRON} alt="" />
            </span>
          </div>
        </div>
      </div>

      <div className="pdp-compare__columns">
        <div className="pdp-compare__col pdp-compare__col--filled">
          <div className="pdp-compare__rule" />
          <div className="pdp-compare__model-head">
            <span>9060</span>
            <img
              className="pdp-compare__chevron"
              src={ICON_MODEL_CHEVRON}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="pdp-compare__thumb">
            {primaryImage ? (
              <img
                className="pdp-compare__thumb-img"
                src={primaryImage}
                alt=""
              />
            ) : null}
            {primaryOverlayImage ? (
              <img
                className="pdp-compare__thumb-img pdp-compare__thumb-img--overlay"
                src={primaryOverlayImage}
                alt=""
              />
            ) : null}
          </div>
          <div className="pdp-compare__rule" />
          <div className="pdp-compare__specs">
            {SPECS_9060.map((spec) => (
              <div key={spec.label} className="pdp-compare__spec">
                <p className="pdp-compare__spec-label">{spec.label}</p>
                <p className="pdp-compare__spec-value">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="pdp-compare__col pdp-compare__col--empty"
          aria-label="Select a shoe to compare"
        >
          <p className="pdp-compare__empty-label">
            Select a shoe
            <br />
            to compare
          </p>
        </div>
      </div>
    </section>
  );
}
