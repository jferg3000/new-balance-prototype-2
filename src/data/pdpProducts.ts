/**
 * Prototype PDP catalog — reusable template data keyed by productId.
 * Quick Shop → PDP carries the selected shoe via location state so the
 * hero stays consistent with the PLP / Quick Shop image.
 */

export type PdpProduct = {
  id: string;
  name: string;
  price: string;
  tagline: string;
  colorName: string;
  /** Optional CSS background for the buy-pack swatch. */
  colorSwatch?: string;
  rating: string;
  reviewCount: string;
  /** Visual buy-pack confirmation label (static for now). */
  addedLabel: string;
  images: {
    /** Dynamic product gallery (Hero / Shoe Angles). */
    hero: string;
    /** Flattened Section 2 editorial composition (rotated/masked bake). */
    section2Composition: string;
    /** Section 3 shop the look — editorial. */
    shopTheLookTall: string;
    shopTheLookWide: string;
    /** Define your style — editorial. */
    defineYourStyle: string;
    comparePrimary: string;
    /** Optional overlay stacked on comparePrimary (Figma 161:837). */
    comparePrimaryOverlay?: string;
    compareSecondary: string;
    editorsHero: string;
    editorsThumbs: string[];
    pairings: string[];
  };
};

/**
 * Location state that carries a PLP selection into the PDP
 * (Quick Shop, Discover colorways, etc.) so the same shoe is shown.
 */
export type PdpEntryState = {
  fromQuickShop?: boolean;
  name?: string;
  price?: string;
  tagline?: string;
  image?: string;
  colorName?: string;
  colorSwatch?: string;
};

const PRODUCT = "/assets/pdp/product";
const EDITORIAL = "/assets/pdp/editorial";

/**
 * Only this product renders the fully designed PDP imagery.
 * All other product ids reuse the template with grey WIP placeholders
 * below the hero.
 */
export const HIGHLIGHTED_PDP_PRODUCT_ID = "9060-quick-shop-test-product";

export type PdpMode = "full" | "placeholder";

/** Full designed PDP vs shared template with grey media placeholders. */
export function resolvePdpMode(productId: string | undefined): PdpMode {
  return productId === HIGHLIGHTED_PDP_PRODUCT_ID ? "full" : "placeholder";
}

/** Default 9060 static PDP matching Figma 108:540. */
export const PDP_9060: PdpProduct = {
  id: HIGHLIGHTED_PDP_PRODUCT_ID,
  name: "9060",
  price: "$144.99",
  tagline: "Everyday comfort, reimagined",
  colorName: "Breakfast Tea with Angora",
  rating: "4.5",
  reviewCount: "(7602)",
  addedLabel: "Added  8.5 / Wide (D)",
  images: {
    hero: `${PRODUCT}/hero-shoe.png`,
    section2Composition: `${EDITORIAL}/section-2-campaign.png`,
    shopTheLookTall: `${EDITORIAL}/shop-the-look-1.png`,
    shopTheLookWide: `${EDITORIAL}/shop-the-look-2.png`,
    defineYourStyle: `${EDITORIAL}/define-your-style.png`,
    /* Same shoe as hero — Compare left column tracks the PDP product */
    comparePrimary: `${PRODUCT}/hero-shoe.png`,
    comparePrimaryOverlay: `${PRODUCT}/hero-shoe-overlay.png`,
    compareSecondary: `${PRODUCT}/compare-740-a.png`,
    editorsHero: `${PRODUCT}/editors-hero.png`,
    editorsThumbs: [
      `${PRODUCT}/editors-1.png`,
      `${PRODUCT}/editors-2.png`,
      `${PRODUCT}/editors-3.png`,
      `${PRODUCT}/editors-4.png`,
      `${PRODUCT}/editors-5.png`,
      `${PRODUCT}/editors-6.png`,
    ],
    pairings: [
      `${PRODUCT}/pair-1.png`,
      `${PRODUCT}/pair-2.png`,
      `${PRODUCT}/pair-3.png`,
      `${PRODUCT}/pair-4.png`,
    ],
  },
};

const CATALOG: Record<string, PdpProduct> = {
  [HIGHLIGHTED_PDP_PRODUCT_ID]: PDP_9060,
};

export function getPdpProduct(productId: string | undefined): PdpProduct {
  if (!productId) return PDP_9060;
  return CATALOG[productId] ?? PDP_9060;
}

/** Apply PLP / Quick Shop overrides onto a catalog PDP template. */
export function resolvePdpProduct(
  productId: string | undefined,
  entry?: PdpEntryState | null,
): PdpProduct {
  const base = getPdpProduct(productId);
  const id = productId || base.id;
  const carry =
    Boolean(entry?.fromQuickShop) || Boolean(entry?.image) || Boolean(entry?.name);
  if (!entry || !carry) {
    return id === base.id ? base : { ...base, id };
  }

  const showcaseImage = entry.image ?? base.images.hero;

  return {
    ...base,
    id,
    name: entry.name ?? base.name,
    price: entry.price ?? base.price,
    tagline: entry.tagline ?? base.tagline,
    colorName: entry.colorName ?? base.colorName,
    colorSwatch: entry.colorSwatch ?? base.colorSwatch,
    images: {
      ...base.images,
      // Keep the same shoe the user selected on the PLP / Quick Shop.
      hero: showcaseImage,
      // Compare “9060” column always shows the shoe this PDP is showcasing.
      comparePrimary: showcaseImage,
    },
  };
}
