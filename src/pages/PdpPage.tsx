import { useLayoutEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import GlobalNavigation from "../components/GlobalNavigation";
import PdpCompare from "../components/pdp/PdpCompare";
import PdpDefineYourStyle from "../components/pdp/PdpDefineYourStyle";
import PdpEditorsPicks from "../components/pdp/PdpEditorsPicks";
import PdpHero from "../components/pdp/PdpHero";
import PdpProductPairings from "../components/pdp/PdpProductPairings";
import PdpSection2 from "../components/pdp/PdpSection2";
import PdpShopTheLook from "../components/pdp/PdpShopTheLook";
import PdpStickyAddToBag from "../components/pdp/PdpStickyAddToBag";
import {
  resolvePdpMode,
  resolvePdpProduct,
  type PdpEntryState,
} from "../data/pdpProducts";
import usePdpStickyAtcMode from "../hooks/usePdpStickyAtcMode";
import "../App.css";
import "./PdpPage.css";

/**
 * Product Detail Page — Updated Figma 161:327.
 * Route: /pdp/:productId
 *
 * Static layout rebuild in progress. Sticky ATC + accordion interactions
 * remain wired; motion polish lands after layout approval.
 */
export default function PdpPage() {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const entry = (location.state ?? null) as PdpEntryState | null;
  const product = resolvePdpProduct(productId, entry);
  const pdpMode = resolvePdpMode(productId);
  const atcMorphTriggerRef = useRef<HTMLLIElement | null>(null);
  const atcMode = usePdpStickyAtcMode(atcMorphTriggerRef, product.id);
  const isFullPdp = pdpMode === "full";

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [productId]);

  return (
    <div
      className="pdp"
      data-product-id={product.id}
      data-atc-mode={atcMode}
      data-pdp-mode={pdpMode}
    >
      <GlobalNavigation variant="content" color="black" />

      <main className="pdp__main">
        <PdpHero product={product} />

        {/*
          Hero is sticky z-1. This block is relative z-3 so campaign / modules
          slide over it — same stack as motion-study-1 ellipse PDP.
        */}
        <div className="pdp-stack">
          <PdpSection2
            compositionSrc={
              isFullPdp ? product.images.section2Composition : ""
            }
            atcFullTriggerRef={atcMorphTriggerRef}
          />

          <PdpShopTheLook
            imageSrc={isFullPdp ? product.images.shopTheLookTall : ""}
          />

          <PdpDefineYourStyle
            videoSrc={
              isFullPdp ? "/assets/pdp/editorial/define-your-style.mp4" : ""
            }
            posterSrc={isFullPdp ? product.images.defineYourStyle : undefined}
          />

          <PdpCompare
            primaryImage={isFullPdp ? product.images.comparePrimary : ""}
            primaryOverlayImage={
              isFullPdp ? product.images.comparePrimaryOverlay : ""
            }
          />

          <PdpEditorsPicks
            heroSrc={isFullPdp ? product.images.editorsHero : ""}
            thumbs={
              isFullPdp
                ? product.images.editorsThumbs
                : ["", "", "", "", "", ""]
            }
          />

          <PdpProductPairings
            images={isFullPdp ? product.images.pairings : ["", "", "", ""]}
          />
        </div>
      </main>

      <PdpStickyAddToBag product={product} mode={atcMode} />
    </div>
  );
}
