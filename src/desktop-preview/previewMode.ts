/** Query flag that forces the real app (never the desktop preview host). */
export const PREVIEW_EMBED_PARAM = "previewEmbed";

/**
 * Top-level viewport must be wider than this to show the grey preview shell.
 * Real phones (incl. “Request Desktop Website” ~980px) are excluded separately
 * via pointer/touch checks — see shouldMountDesktopPreviewHost().
 */
export const DESKTOP_PREVIEW_MIN_WIDTH_PX = 769;

/**
 * True when this document should mount the production app tree.
 * - Inside the desktop preview iframe
 * - Or when opened with ?previewEmbed=1 (debug / direct embed)
 */
export function isPreviewEmbed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.self !== window.top) return true;
  } catch {
    // Cross-origin frame access can throw; treat as embed.
    return true;
  }
  return (
    new URLSearchParams(window.location.search).get(PREVIEW_EMBED_PARAM) === "1"
  );
}

function isTopLevelWindow(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

/**
 * Top-level desktop only: mount the grey stage + iframe host.
 *
 * Real mobile must NEVER use the host — commerce routes (PLP / Collection / PDP)
 * need top-level document scroll so Safari can collapse its chrome. Scrolling
 * inside an iframe does not drive that.
 *
 * Gate:
 * - top-level window only
 * - viewport width ≥ 769px
 * - not a coarse-pointer / touch-primary device (blocks iPhone “desktop site”)
 */
export function shouldMountDesktopPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  if (!isTopLevelWindow()) return false;
  if (isPreviewEmbed()) return false;

  const wideEnough = window.matchMedia(
    `(min-width: ${DESKTOP_PREVIEW_MIN_WIDTH_PX}px)`,
  ).matches;

  // iPhone / iPod (and most phones) report coarse pointer + touch points even
  // when “Request Desktop Website” inflates layout width past 769px.
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const touchPrimary = navigator.maxTouchPoints > 0 && coarsePointer;
  if (touchPrimary) return false;

  return wideEnough;
}

/** Same URL as the host, with previewEmbed=1 so the iframe never nests another host. */
export function buildPreviewEmbedSrc(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(PREVIEW_EMBED_PARAM, "1");
  return `${url.pathname}${url.search}${url.hash}`;
}
