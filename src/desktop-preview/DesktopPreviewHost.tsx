import { useMemo } from "react";
import { buildPreviewEmbedSrc } from "./previewMode";
import "./DesktopPreviewHost.css";

/**
 * Desktop preview host (Option B).
 *
 * Renders only a grey stage + iframe. The real application — including
 * Homepage stacked-card motion, sticky chrome, drawers, and portals —
 * runs inside the iframe with a true ~430px document viewport.
 */
export default function DesktopPreviewHost() {
  const src = useMemo(() => buildPreviewEmbedSrc(), []);

  return (
    <div className="desktop-preview-host">
      <iframe
        className="desktop-preview-host__frame"
        title="New Balance mobile preview"
        src={src}
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
