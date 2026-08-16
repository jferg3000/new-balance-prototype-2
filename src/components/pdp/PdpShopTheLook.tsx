import { usePdpRevealOnce } from "../../hooks/usePdpMotion";

type PdpShopTheLookProps = {
  /** Single tall editorial shot — Figma 161:404. */
  imageSrc: string;
};

/**
 * Updated PDP — Figma 161:404 Shop the look.
 * One editorial frame + plus (wide companion removed).
 */
export default function PdpShopTheLook({ imageSrc }: PdpShopTheLookProps) {
  const revealRef = usePdpRevealOnce<HTMLElement>();

  return (
    <section
      ref={revealRef}
      className="pdp-stl"
      data-node-id="161:404"
      aria-label="Shop the look"
    >
      <div className="pdp-stl__shot pdp-stl__shot--tall pdp-reveal-item">
        {imageSrc ? <img src={imageSrc} alt="" /> : null}
        <span className="pdp-stl__add" aria-hidden="true">
          <span className="pdp-stl__plus" />
        </span>
      </div>
    </section>
  );
}
