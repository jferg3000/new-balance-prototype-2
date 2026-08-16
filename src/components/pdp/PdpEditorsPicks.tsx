import { usePdpRevealOnce } from "../../hooks/usePdpMotion";

type PdpEditorsPicksProps = {
  heroSrc: string;
  thumbs: string[];
};

/**
 * Updated PDP — Figma 161:754 Ellipse-Editor's Pick (402×772).
 * Title overlays the hero; 3×2 thumb grid overlaps the hero by 20px.
 */
export default function PdpEditorsPicks({
  heroSrc,
  thumbs,
}: PdpEditorsPicksProps) {
  const revealRef = usePdpRevealOnce<HTMLElement>();

  return (
    <section
      ref={revealRef}
      className="pdp-editors pdp-reveal-section"
      data-node-id="161:754"
      aria-label="Lifestyle, curated"
    >
      <div className="pdp-editors__hero">
        {heroSrc ? <img src={heroSrc} alt="" /> : null}
        <h2 className="pdp-editors__title">Lifestyle, curated</h2>
      </div>
      <ul className="pdp-editors__grid">
        {thumbs.map((src, i) => (
          <li key={`editors-thumb-${i}`} className="pdp-editors__thumb">
            {src ? <img src={src} alt="" /> : null}
          </li>
        ))}
      </ul>
      <a className="pdp-editors__link" href="#lifestyle-shoes">
        Shop all lifestyle shoes
      </a>
    </section>
  );
}
