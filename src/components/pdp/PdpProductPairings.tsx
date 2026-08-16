import { usePdpRevealOnce } from "../../hooks/usePdpMotion";

type PdpProductPairingsProps = {
  images: string[];
};

/** Figma 108:649 — Product pairings 2×2 grid (static). */
export default function PdpProductPairings({ images }: PdpProductPairingsProps) {
  const revealRef = usePdpRevealOnce<HTMLElement>();

  return (
    <section
      ref={revealRef}
      className="pdp-pairings pdp-reveal-section"
      aria-label="Product pairings"
    >
      <h2 className="pdp-pairings__title">Product pairings</h2>
      <ul className="pdp-pairings__grid">
        {images.slice(0, 4).map((src, i) => (
          <li key={`pair-${i}`} className="pdp-pairings__card">
            {src ? <img src={src} alt="" /> : null}
            <span className="pdp-pairings__plus" aria-hidden="true" />
          </li>
        ))}
      </ul>
      <div className="pdp-pairings__indicator" aria-hidden="true">
        <span className="pdp-pairings__indicator-active" />
        <span className="pdp-pairings__indicator-rest" />
      </div>
    </section>
  );
}
