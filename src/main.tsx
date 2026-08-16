import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/scrollReveal.css";
import "./styles/maskedLine.css";
import App from "./App.tsx";
import DesktopPreviewHost from "./desktop-preview/DesktopPreviewHost";
import {
  DESKTOP_PREVIEW_MIN_WIDTH_PX,
  isPreviewEmbed,
  shouldMountDesktopPreviewHost,
} from "./desktop-preview/previewMode";

/**
 * Root gate for desktop preview mode (feature/desktop-preview only).
 *
 * - Wide fine-pointer desktop (top-level) → grey stage + iframe
 * - Real mobile / coarse pointer / iframe / ?previewEmbed=1 → <App /> as
 *   the top-level document (commerce native scroll + Safari chrome collapse)
 */
function Root() {
  const [showHost, setShowHost] = useState(shouldMountDesktopPreviewHost);

  useEffect(() => {
    // Embed / iframe always runs the real app — never swap to a nested host.
    if (isPreviewEmbed()) {
      setShowHost(false);
      return;
    }

    const wideMql = window.matchMedia(
      `(min-width: ${DESKTOP_PREVIEW_MIN_WIDTH_PX}px)`,
    );
    const coarseMql = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      setShowHost(shouldMountDesktopPreviewHost());
    };

    sync();
    wideMql.addEventListener("change", sync);
    coarseMql.addEventListener("change", sync);
    return () => {
      wideMql.removeEventListener("change", sync);
      coarseMql.removeEventListener("change", sync);
    };
  }, []);

  if (showHost) return <DesktopPreviewHost />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
