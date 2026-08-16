/**
 * Tunable motion tokens for PdpStickyAddToBag detailed ↔ simple morph.
 * Adjust here — values are applied as CSS custom properties on the CTA root.
 */
export const morphDuration = 620; // ms — shell width/inset/height/padding/bg
export const morphEase = "cubic-bezier(0.16, 1, 0.3, 1)"; // fast start, soft settle

/** Detailed content (color row + detailed label) fade-out / fade-in */
export const contentFadeDuration = 220; // ms
export const contentFadeDelay = 0; // ms — start fading as the shell begins

/** Simplified “Add to bag” label fade-in (overlap with detailed fade) */
export const simpleLabelFadeDuration = 260; // ms
export const simpleLabelFadeDelay = 150; // ms

export const pdpStickyAtcMotionStyle = {
  ["--pdp-atc-morph-duration" as string]: `${morphDuration}ms`,
  ["--pdp-atc-morph-ease" as string]: morphEase,
  ["--pdp-atc-content-fade-duration" as string]: `${contentFadeDuration}ms`,
  ["--pdp-atc-content-fade-delay" as string]: `${contentFadeDelay}ms`,
  ["--pdp-atc-simple-fade-duration" as string]: `${simpleLabelFadeDuration}ms`,
  ["--pdp-atc-simple-fade-delay" as string]: `${simpleLabelFadeDelay}ms`,
} as const;
