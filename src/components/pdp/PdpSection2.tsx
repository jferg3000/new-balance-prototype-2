import { useId, useState, type ReactNode, type RefObject } from "react";

type OpenSection = "product-details" | "size-fit" | null;

/** Figma 161:394 — always-visible lead (not an accordion). */
const LEAD_COPY =
  "The 9060 reimagines the classic 99X series through a futuristic Y2K lens. Expanded 990 sway bars create a sense of motion across the upper, while wavy lines and exaggerated proportions highlight the sculpted ABZORB and SBS cushioning.";

const FEATURES = [
  "Dual-density midsole featuring ABZORB and SBS cushioning",
  "Tongue logo inspired by original 991 lace jewel",
  "Translucent CR device at heel",
  "Diamond outsole pattern inspired by classic 860 design",
  "387 grams (13.7 oz)",
] as const;

const MATERIALS = [
  "Mesh upper with suede overlays",
  "This item contains cow leather",
] as const;

type PdpSection2Props = {
  /** Campaign / composition image above product details. */
  compositionSrc: string;
  /** Sticky ATC morph trigger — Product details row in the updated PDP. */
  atcFullTriggerRef?: RefObject<HTMLLIElement | null>;
};

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="pdp-info__bullet">
      <img
        className="pdp-info__bullet-icon"
        src="/assets/pdp/description/icon-bullet.svg"
        alt=""
        width={18}
        height={18}
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

function PanelBody({ section }: { section: NonNullable<OpenSection> }) {
  if (section === "product-details") {
    return (
      <>
        <div className="pdp-info__block">
          <p className="pdp-info__subtitle">Features</p>
          <ul className="pdp-info__list">
            {FEATURES.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </div>
        <div className="pdp-info__block">
          <p className="pdp-info__subtitle">Material</p>
          <ul className="pdp-info__list">
            {MATERIALS.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
        </div>
        <p className="pdp-info__style">Style #:&nbsp;U90603EG</p>
      </>
    );
  }

  return (
    <ul className="pdp-info__list">
      <Bullet>
        Traditional lace-up closure provides an adjustable fit with a classic
        look
      </Bullet>
      <Bullet>
        <a className="pdp-info__link" href="#size-guide">
          Size & fit guide
        </a>
      </Bullet>
    </ul>
  );
}

/**
 * Product details — lower divider is the fixed anchor.
 * In-flow spacer grows the panel upward so Size & fit never moves down.
 */
function ProductDetailsRow({
  expanded,
  baseId,
  atcFullTriggerRef,
  onToggle,
}: {
  expanded: boolean;
  baseId: string;
  atcFullTriggerRef?: RefObject<HTMLLIElement | null>;
  onToggle: () => void;
}) {
  const panelId = `${baseId}-product-details-panel`;

  return (
    <>
      <li
        className="pdp-section2__details-spacer"
        aria-hidden="true"
        data-open={expanded ? "true" : undefined}
      >
        <div
          className="pdp-section2__body"
          data-open={expanded ? "true" : "false"}
        >
          <div className="pdp-section2__body-clip">
            <div className="pdp-section2__body-inner pdp-section2__body-inner--ghost">
              <PanelBody section="product-details" />
            </div>
          </div>
        </div>
      </li>

      <li
        className="pdp-section2__item pdp-section2__item--product-details"
        ref={atcFullTriggerRef}
        data-atc-morph-trigger="true"
        data-open={expanded ? "true" : undefined}
      >
        <div className="pdp-section2__details-rise">
          <button
            type="button"
            className="pdp-section2__trigger"
            id={`${baseId}-product-details-trigger`}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <span>Product details</span>
            <span
              className={
                expanded
                  ? "pdp-section2__plus pdp-section2__plus--close"
                  : "pdp-section2__plus"
              }
              aria-hidden="true"
            />
          </button>

          <div
            className="pdp-section2__body"
            id={panelId}
            role="region"
            aria-labelledby={`${baseId}-product-details-trigger`}
            aria-hidden={!expanded}
            inert={!expanded ? true : undefined}
            data-open={expanded ? "true" : "false"}
          >
            <div className="pdp-section2__body-clip">
              <div className="pdp-section2__body-inner">
                <PanelBody section="product-details" />
              </div>
            </div>
          </div>
        </div>
      </li>
    </>
  );
}

function SizeFitRow({
  expanded,
  baseId,
  onToggle,
}: {
  expanded: boolean;
  baseId: string;
  onToggle: () => void;
}) {
  const panelId = `${baseId}-size-fit-panel`;

  return (
    <li
      className="pdp-section2__item"
      data-open={expanded ? "true" : undefined}
    >
      <button
        type="button"
        className="pdp-section2__trigger"
        id={`${baseId}-size-fit-trigger`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>Size & fit</span>
        <span
          className={
            expanded
              ? "pdp-section2__plus pdp-section2__plus--close"
              : "pdp-section2__plus"
          }
          aria-hidden="true"
        />
      </button>

      <div
        className="pdp-section2__body"
        id={panelId}
        role="region"
        aria-labelledby={`${baseId}-size-fit-trigger`}
        aria-hidden={!expanded}
        inert={!expanded ? true : undefined}
        data-open={expanded ? "true" : "false"}
      >
        <div className="pdp-section2__body-clip">
          <div className="pdp-section2__body-inner">
            <PanelBody section="size-fit" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Updated PDP — Figma 161:771 (9061).
 * Campaign image + always-visible lead copy + Product details / Size & fit.
 */
export default function PdpSection2({
  compositionSrc,
  atcFullTriggerRef,
}: PdpSection2Props) {
  const [openSection, setOpenSection] = useState<OpenSection>(null);
  const baseId = useId();

  const toggle = (id: NonNullable<OpenSection>) => {
    setOpenSection((current) => (current === id ? null : id));
  };

  return (
    <section
      className="pdp-section2"
      data-expanded={openSection ? "true" : undefined}
      data-node-id="161:771"
      aria-label="Product description"
    >
      <div className="pdp-section2__media">
        {compositionSrc ? (
          <img
            className="pdp-section2__composition"
            src={compositionSrc}
            alt=""
          />
        ) : null}
      </div>

      <div
        className="pdp-section2__panel"
        data-expanded={openSection ? "true" : undefined}
        data-open-section={openSection ?? undefined}
      >
        <p className="pdp-section2__lead">{LEAD_COPY}</p>

        <ul className="pdp-section2__accordion">
          <ProductDetailsRow
            expanded={openSection === "product-details"}
            baseId={baseId}
            atcFullTriggerRef={atcFullTriggerRef}
            onToggle={() => toggle("product-details")}
          />
          <SizeFitRow
            expanded={openSection === "size-fit"}
            baseId={baseId}
            onToggle={() => toggle("size-fit")}
          />
        </ul>
      </div>
    </section>
  );
}
