import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ActiveFilterChips, {
  type ActiveFilterChip,
} from "../components/filters/ActiveFilterChips";
import FilterDrawer, {
  buildActiveFilterChips,
  removeAppliedFilterChip,
  selectionHasFilters,
  type AppliedFilterSelection,
} from "../components/filters/FilterDrawer";
import GlobalNavigation from "../components/GlobalNavigation";
import { ScrollReveal } from "../components/ScrollReveal";
import QuickShopDrawer, {
  colorsFromShoeImage,
  toQuickShopProduct,
  type QuickShopProduct,
} from "../components/quickshop/QuickShopDrawer";
import type { PdpEntryState } from "../data/pdpProducts";
import { useScrollHeader } from "../hooks/useScrollAwareHeader";
import "../App.css";
import "./Plp9060Page.css";

type ViewMode = "two-column" | "three-column";

type ProductAnchor = {
  id: string;
  offset: number;
};

function stickyContentTop() {
  const styles = getComputedStyle(document.documentElement);
  const promo = Number.parseFloat(styles.getPropertyValue("--promo-bar-height")) || 0;
  const nav = Number.parseFloat(styles.getPropertyValue("--nav-height")) || 0;
  return promo + nav;
}

/** First product card intersecting the content viewport (below sticky chrome). */
function captureProductAnchor(): ProductAnchor | null {
  const cards = document.querySelectorAll<HTMLElement>("[data-product-id]");
  if (!cards.length) return null;

  const topBound = stickyContentTop();
  const bottomBound = window.innerHeight;
  let best: HTMLElement | null = null;
  let bestTop = Number.POSITIVE_INFINITY;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.bottom <= topBound || rect.top >= bottomBound) continue;
    if (rect.top < bestTop) {
      bestTop = rect.top;
      best = card;
    }
  }

  if (!best) return null;
  const id = best.getAttribute("data-product-id");
  if (!id) return null;
  return { id, offset: best.getBoundingClientRect().top };
}

function restoreProductAnchor(anchor: ProductAnchor) {
  const el = document.querySelector<HTMLElement>(
    `[data-product-id="${CSS.escape(anchor.id)}"]`,
  );
  if (!el) return;
  const delta = el.getBoundingClientRect().top - anchor.offset;
  if (Math.abs(delta) > 0.5) {
    window.scrollBy(0, delta);
  }
}

const VIEW_MORE_DELAY_MS = 500;
const BATCH_SKELETON_DELAY_MS = 450;
/** Fake load after Filter Apply before showing filtered results. */
const FILTER_SKELETON_DELAY_MS = 520;
/** Time for image/text fade to settle before unlocking the next batch */
const BATCH_REVEAL_SETTLE_MS = 700;
/** 2-col → 3-col simulated image reveal */
const VIEW_ENTER_DURATION_MS = 300;
const VIEW_ENTER_STAGGER_MS = 75;
const VIEW_ENTER_IO_ROOT_MARGIN = "0px 0px 120px 0px";

/** Flattened Figma frame exports (shadows/crop/effects baked in). */
const assets = {
  hero: "/assets/plp/hero.jpg",
  discover: [
    "/assets/plp/discover-01.jpg",
    "/assets/plp/discover-02.jpg",
  ] as const,
  quoteEditorial: "/assets/plp/stl-02.webp",
  maylike740: "/assets/plp/maylike-01.jpg",
  /** Clipped peek of next card as exported from Figma (visible strip only). */
  maylike2: "/assets/plp/maylike-02.jpg",
  stl: [
    "/assets/plp/stl-01.jpg",
    "/assets/plp/stl-02.webp",
    "/assets/plp/stl-03.jpg",
    "/assets/plp/stl-04.jpg",
    "/assets/plp/stl-05.jpg",
    "/assets/plp/stl-06.jpg",
  ] as const,
  products: [
    "/assets/plp/p01.png",
    "/assets/plp/p02.png",
    "/assets/plp/p03.png",
    "/assets/plp/p04.png",
    "/assets/plp/p05.png",
    "/assets/plp/p06.png",
    "/assets/plp/p07.png",
    "/assets/plp/p08.png",
    "/assets/plp/p09.png",
    "/assets/plp/p10.png",
    "/assets/plp/p11.png",
    "/assets/plp/p12.png",
  ] as const,
  /** Figma 141:1102 — 4 cards below the quote (plp section 03). */
  section03: [
    "/assets/plp/s03-01.png",
    "/assets/plp/s03-02.png",
    "/assets/plp/s03-03.png",
    "/assets/plp/s03-04.png",
  ] as const,
  /** Figma 141:1147 — plp section 04 (source of truth; ignore screenshots). */
  section04: [
    "/assets/plp/s04-01.png",
    "/assets/plp/s04-02.png",
    "/assets/plp/s04-03.png",
    "/assets/plp/s04-04.png",
  ] as const,
  /** Figma 141:1191 — plp section 05 Big Kids (14 cards). */
  section05: [
    "/assets/plp/s05-01.png",
    "/assets/plp/s05-02.png",
    "/assets/plp/s05-03.png",
    "/assets/plp/s05-04.png",
    "/assets/plp/s05-05.png",
    "/assets/plp/s05-06.png",
    "/assets/plp/s05-07.png",
    "/assets/plp/s05-08.png",
    "/assets/plp/s05-09.png",
    "/assets/plp/s05-10.png",
    "/assets/plp/s05-11.png",
    "/assets/plp/s05-12.png",
    "/assets/plp/s05-13.png",
    "/assets/plp/s05-14.png",
  ] as const,
  /** Figma 141:1391 — plp section 06 Little Kids (14 cards). */
  section06: [
    "/assets/plp/s06-01.png",
    "/assets/plp/s06-02.png",
    "/assets/plp/s06-03.png",
    "/assets/plp/s06-04.png",
    "/assets/plp/s06-05.png",
    "/assets/plp/s06-06.png",
    "/assets/plp/s06-07.png",
    "/assets/plp/s06-08.png",
    "/assets/plp/s06-09.png",
    "/assets/plp/s06-10.png",
    "/assets/plp/s06-11.png",
    "/assets/plp/s06-12.png",
    "/assets/plp/s06-13.png",
    "/assets/plp/s06-14.png",
  ] as const,
  /** Figma 141:1539 — plp section 07 Babies & Toddlers (14 cards). */
  section07: [
    "/assets/plp/s07-01.png",
    "/assets/plp/s07-02.png",
    "/assets/plp/s07-03.png",
    "/assets/plp/s07-04.png",
    "/assets/plp/s07-05.png",
    "/assets/plp/s07-06.png",
    "/assets/plp/s07-07.png",
    "/assets/plp/s07-08.png",
    "/assets/plp/s07-09.png",
    "/assets/plp/s07-10.png",
    "/assets/plp/s07-11.png",
    "/assets/plp/s07-12.png",
    "/assets/plp/s07-13.png",
    "/assets/plp/s07-14.png",
  ] as const,
};

type ProductCard = {
  /** Stable id — when set, used for Quick Shop / PDP routing instead of grid index. */
  id?: string;
  name: string;
  category?: string;
  price: string;
  compareAt?: string;
  badge?: string;
  image: string;
  /** Optional Quick Shop tagline override (defaults to category / comfort line). */
  tagline?: string;
};

/** Stable id for the controlled Quick Shop → dedicated PDP test product. */
export const QUICK_SHOP_TEST_PRODUCT_ID = "9060-quick-shop-test-product";

const QUICK_SHOP_TEST_PRODUCT: ProductCard = {
  id: QUICK_SHOP_TEST_PRODUCT_ID,
  name: "9060",
  category: "Unisex Lifestyle",
  tagline: "Everyday comfort, reimagined",
  price: "$144.99",
  image: "/assets/plp/p-9060-quick-shop-test.png",
};

type FlatGridItem = {
  product: ProductCard;
  productId: string;
  reveal?: boolean;
};

const DISCOVER = [
  {
    id: "discover-01",
    name: "9060",
    label: "Sea salt with black and linen",
    price: "$159.99",
    image: assets.discover[0],
    /** Sticky ATC swatch on PDP — sea salt / linen / black */
    colorSwatch:
      "linear-gradient(45deg, #f5f2ec 8%, #e8e2d6 32%, #c4b8a4 52%, #1a1a1a 78%)",
  },
  {
    id: "discover-02",
    name: "9060",
    label: "Black with afterglow and black metallic",
    price: "$159.99",
    image: assets.discover[1],
    /** Sticky ATC swatch on PDP — black with afterglow accent */
    colorSwatch:
      "linear-gradient(45deg, #2a2a2a 12%, #151415 48%, #c8f24a 82%)",
  },
];

function imgAt(i: number) {
  return assets.products[i % assets.products.length];
}

function makeCards(
  count: number,
  base: Omit<ProductCard, "image">,
  start = 0,
): ProductCard[] {
  return Array.from({ length: count }, (_, i) => ({
    ...base,
    image: imgAt(start + i),
  }));
}

/** 85:2850 — 3 rows */
const SECTION_01: ProductCard[] = [
  {
    name: "9060S",
    category: "Unisex Lifestyle",
    price: "$139.00",
    badge: "Best Seller",
    image: imgAt(0),
  },
  {
    name: "9060S",
    category: "Unisex Lifestyle",
    price: "$159.99",
    badge: "Best Seller",
    image: imgAt(1),
  },
  {
    name: "9060R",
    category: "Unisex Lifestyle",
    price: "$139.00",
    image: imgAt(2),
  },
  {
    name: "9060R",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: imgAt(3),
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$139.00",
    compareAt: "$159.99",
    image: imgAt(4),
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: imgAt(5),
  },
];

/** 85:2786 — 3 rows */
const SECTION_02: ProductCard[] = makeCards(
  6,
  { name: "9060", category: "Unisex Lifestyle", price: "$139.00" },
  6,
).map((card, i) =>
  i % 2 === 1
    ? { ...card, price: i === 5 ? "$159.99" : "$159.99" }
    : i === 4
      ? { ...card, compareAt: "$159.99", price: "$139.00" }
      : card,
);

/** 141:1102 / 85:3549 — 2 rows below quote */
const SECTION_03: ProductCard[] = [
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$139.00",
    image: assets.section03[0],
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: assets.section03[1],
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$139.00",
    image: assets.section03[2],
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: assets.section03[3],
  },
];

/** 141:1147 / 86:3701 — 2 rows after shop the look 03 */
const SECTION_04: ProductCard[] = [
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$139.00",
    image: assets.section04[0],
  },
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: assets.section04[1],
  },
  // Dedicated test shoe — Quick Shop → full Breakfast Tea PDP
  QUICK_SHOP_TEST_PRODUCT,
  {
    name: "9060",
    category: "Unisex Lifestyle",
    price: "$159.99",
    image: assets.section04[3],
  },
];

/** 141:1191 / 86:3702 — 7 rows Big Kids */
const SECTION_05: ProductCard[] = assets.section05.map((image, i) => ({
  name: "9060 Lace",
  category: "Big Kids (Size 3.5 - 7)",
  price: i % 2 ? "$159.99" : "$139.00",
  image,
}));

/** 141:1391 — 7 rows Little Kids (11 Lace + 3 Bungee) */
const SECTION_06: ProductCard[] = assets.section06.map((image, i) =>
  i >= 11
    ? {
        name: "9060 Bungee",
        category: "Little Kids (Size 10.5 - 3)",
        price: "$89.99",
        image,
      }
    : {
        name: "9060 Lace",
        category: "Little Kids (Size 10.5 - 3)",
        price: i === 9 ? "$104.99" : i % 2 ? "$159.99" : "$139.00",
        image,
      },
);

/** 141:1539 — 7 rows Babies (13 Bungee + 1 9060) */
const SECTION_07: ProductCard[] = assets.section07.map((image, i) => ({
  name: i === 13 ? "9060" : "9060 Bungee",
  category: "Babies & Toddlers (Size 2 - 10)",
  price: "$89.99",
  image,
}));

function PlusMark() {
  return <span className="plp-plus" aria-hidden="true" />;
}

function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="plp-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/** Matches real ProductTile shell dimensions exactly (tile + meta + plus). */
function ProductCardSkeleton() {
  return (
    <article className="plp-card plp-card--skeleton" aria-hidden="true">
      <div className="plp-card__tile">
        <div className="plp-card__media">
          <div className="plp-skel plp-skel--media" />
        </div>
        <PlusMark />
      </div>
      <div className="plp-card__meta">
        <div className="plp-skel plp-skel--line plp-skel--name" />
        <div className="plp-skel plp-skel--line plp-skel--cat" />
        <div className="plp-skel plp-skel--line plp-skel--price" />
      </div>
    </article>
  );
}

function ProductTile({
  product,
  productId,
  reveal = false,
  onSelect,
}: {
  product: ProductCard;
  productId: string;
  reveal?: boolean;
  onSelect?: (product: ProductCard, productId: string) => void;
}) {
  const pdpLabel = [
    product.name,
    product.category,
    product.compareAt ? `${product.price}, was ${product.compareAt}` : product.price,
  ]
    .filter(Boolean)
    .join(", ");

  const pdpState = {
    name: product.name,
    price: product.price,
    tagline: product.tagline,
    image: product.image,
  } satisfies PdpEntryState;

  return (
    <article
      className={reveal ? "plp-card plp-card--reveal" : "plp-card"}
      data-product-id={productId}
    >
      <div className="plp-card__tile">
        {product.badge ? <span className="plp-card__badge">{product.badge}</span> : null}
        <div className="plp-card__media">
          <img className="plp-card__img" src={product.image} alt="" />
        </div>
        {/* Sibling of the PDP link — not nested inside it */}
        <button
          type="button"
          className="plp-card__quickshop"
          aria-label={`Open Quick Shop for ${product.name}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect?.(product, productId);
          }}
        >
          <PlusMark />
        </button>
      </div>
      <div className="plp-card__meta">
        <p className="plp-card__name">{product.name}</p>
        {product.category ? <p className="plp-card__category">{product.category}</p> : null}
        <p className="plp-card__price">
          {product.compareAt ? (
            <>
              <span className="plp-card__compare">{product.compareAt}</span>
              <span>{product.price}</span>
            </>
          ) : (
            product.price
          )}
        </p>
      </div>
      <Link
        to={`/pdp/${productId}`}
        className="plp-card__hit"
        state={pdpState}
        aria-label={pdpLabel}
      />
    </article>
  );
}

function ProductGrid({
  products,
  idPrefix,
  items,
  reveal = false,
  skeletonCount = 0,
  onProductSelect,
}: {
  products?: ProductCard[];
  idPrefix?: string;
  items?: FlatGridItem[];
  reveal?: boolean;
  /** Extra skeleton cells appended inside this same grid (3-col continuous load). */
  skeletonCount?: number;
  onProductSelect?: (product: ProductCard, productId: string) => void;
}) {
  const resolved: FlatGridItem[] =
    items ??
    (products ?? []).map((product, index) => ({
      product,
      productId: product.id ?? `${idPrefix}-${index}`,
      reveal,
    }));

  return (
    <div className="plp-grid">
      {resolved.map((item) => (
        <ProductTile
          key={item.productId}
          productId={item.productId}
          product={item.product}
          reveal={item.reveal}
          onSelect={onProductSelect}
        />
      ))}
      {Array.from({ length: skeletonCount }, (_, i) => (
        <ProductCardSkeleton key={`skel-${i}`} />
      ))}
    </div>
  );
}

function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className="plp-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={`skel-${i}`} />
      ))}
    </div>
  );
}

/** Flatten section + loaded batches into one ordered list (stable product ids). */
function buildFlatProductItems(
  visibleBatchCount: number,
  pendingBatchIndex: number | null,
  pendingPhase: "skeleton" | "reveal" | null,
): FlatGridItem[] {
  const items: FlatGridItem[] = [];

  SECTION_01.forEach((product, index) => {
    items.push({ product, productId: product.id ?? `s01-${index}` });
  });
  SECTION_02.forEach((product, index) => {
    items.push({ product, productId: product.id ?? `s02-${index}` });
  });

  for (let i = 0; i < visibleBatchCount; i++) {
    const batch = LAZY_BATCHES[i];
    batch.products.forEach((product, index) => {
      items.push({
        product,
        productId: product.id ?? `${batch.idPrefix}-${index}`,
      });
    });
  }

  // Reveal phase: mount real cards in the same flat grid (no separate section grid).
  if (pendingBatchIndex !== null && pendingPhase === "reveal") {
    const batch = LAZY_BATCHES[pendingBatchIndex];
    batch.products.forEach((product, index) => {
      items.push({
        product,
        productId: product.id ?? `${batch.idPrefix}-${index}`,
        reveal: true,
      });
    });
  }

  return items;
}

/**
 * Prototype helper: take exactly `count` product cards from the ordered catalog.
 * If count exceeds the catalog, reuse entries with unique ids and no adjacent duplicates.
 */
function takeProductSlice(source: FlatGridItem[], count: number): FlatGridItem[] {
  if (count <= 0 || source.length === 0) return [];
  if (count <= source.length) return source.slice(0, count);

  const result: FlatGridItem[] = source.map((item) => ({ ...item }));
  let cursor = 0;

  while (result.length < count) {
    const last = result[result.length - 1];
    const lastBaseId = last.productId.replace(/^filt-\d+-/, "");
    let pick = source[cursor % source.length];
    let attempts = 0;

    while (pick.productId === lastBaseId && attempts < source.length) {
      cursor += 1;
      pick = source[cursor % source.length];
      attempts += 1;
    }

    result.push({
      product: pick.product,
      productId: `filt-${result.length}-${pick.productId}`,
    });
    cursor += 1;
  }

  return result;
}

const QUICK_SHOP_TEST_ITEM: FlatGridItem = {
  product: QUICK_SHOP_TEST_PRODUCT,
  productId: QUICK_SHOP_TEST_PRODUCT_ID,
};

/**
 * Build filtered results of exact `count`, with the fixed Quick Shop test product
 * always at second-row / first-column (index === columnCount).
 */
function withFixedQuickShopTestProduct(
  source: FlatGridItem[],
  count: number,
  columnCount: number,
): FlatGridItem[] {
  if (count <= 0) return [];

  const withoutFixed = source.filter(
    (item) => item.productId !== QUICK_SHOP_TEST_PRODUCT_ID,
  );
  const others = takeProductSlice(withoutFixed, Math.max(0, count - 1));
  const targetIndex = Math.min(columnCount, others.length);
  const result = [...others];
  result.splice(targetIndex, 0, { ...QUICK_SHOP_TEST_ITEM });
  return result.slice(0, count);
}

/** Tall shop-the-look insert — Figma 256×365 + py 32; flattened export fills frame */
function ShopTheLook({ src, label }: { src: string; label: string }) {
  return (
    <ScrollReveal className="plp-stl" aria-label={label}>
      <div className="plp-stl__frame">
        <img className="plp-stl__img" src={src} alt="" />
        <span className="plp-stl__add" aria-hidden="true">
          <span className="plp-stl__plus" />
        </span>
      </div>
    </ScrollReveal>
  );
}

function YouMayLike() {
  return (
    <ScrollReveal
      className="plp-block plp-block--maylike plp-maylike"
      aria-label="You may like"
    >
      <h2 className="plp-maylike__title">You may like</h2>
      <div className="plp-maylike__track">
        <article className="plp-maylike__card">
          <div className="plp-maylike__media">
            <img className="plp-maylike__img" src={assets.maylike740} alt="" />
          </div>
          <div className="plp-maylike__meta">
            <p className="plp-maylike__name">740</p>
            <p className="plp-maylike__desc">Built for everyday</p>
          </div>
        </article>
        <article className="plp-maylike__card plp-maylike__card--peek" aria-hidden="true">
          <div className="plp-maylike__media">
            <img className="plp-maylike__img" src={assets.maylike2} alt="" />
          </div>
        </article>
      </div>
      <div className="plp-maylike__progress" aria-hidden="true">
        <span className="plp-maylike__bar plp-maylike__bar--active" />
        <span className="plp-maylike__bar" />
      </div>
    </ScrollReveal>
  );
}

type LazyBatchDef = {
  id: string;
  products: ProductCard[];
  idPrefix: string;
  sectionLabel: string;
  sectionClass: string;
  lead:
    | { type: "quote" }
    | { type: "stl"; src: string; label: string; blockClass: string };
};

type BatchPhase = "skeleton" | "reveal" | "done";

/** Content from “shop the look 02” onward — existing Figma order, no duplicates. */
const LAZY_BATCHES: LazyBatchDef[] = [
  {
    id: "batch-1",
    products: SECTION_03,
    idPrefix: "s03",
    sectionLabel: "Product section 03",
    sectionClass: "plp-block--plp03",
    lead: { type: "quote" },
  },
  {
    id: "batch-2",
    products: SECTION_04,
    idPrefix: "s04",
    sectionLabel: "Product section 04",
    sectionClass: "plp-block--plp04",
    lead: {
      type: "stl",
      src: assets.stl[2],
      label: "Shop the look 03",
      blockClass: "plp-block--stl03",
    },
  },
  {
    id: "batch-3",
    products: SECTION_05,
    idPrefix: "s05",
    sectionLabel: "Product section 05",
    sectionClass: "plp-block--plp05",
    lead: {
      type: "stl",
      src: assets.stl[3],
      label: "Shop the look 04",
      blockClass: "plp-block--stl04",
    },
  },
  {
    id: "batch-4",
    products: SECTION_06,
    idPrefix: "s06",
    sectionLabel: "Product section 06",
    sectionClass: "plp-block--plp06",
    lead: {
      type: "stl",
      src: assets.stl[4],
      label: "Shop the look 05",
      blockClass: "plp-block--stl05",
    },
  },
  {
    id: "batch-5",
    products: SECTION_07,
    idPrefix: "s07",
    sectionLabel: "Product section 07",
    sectionClass: "plp-block--plp07",
    lead: {
      type: "stl",
      src: assets.stl[5],
      label: "Shop the look 06",
      blockClass: "plp-block--stl06",
    },
  },
];

function QuoteLead({ skeleton }: { skeleton?: boolean }) {
  if (skeleton) {
    return (
      <aside className="plp-block plp-block--stl02 plp-quote" aria-hidden="true">
        <div className="plp-quote__copy">
          <div className="plp-skel plp-skel--quote-line" />
          <div className="plp-skel plp-skel--quote-line plp-skel--quote-line-short" />
          <div className="plp-skel plp-skel--quote-attr" />
        </div>
        <div className="plp-quote__media">
          <div className="plp-skel plp-skel--quote-media" />
        </div>
      </aside>
    );
  }
  return (
    <ScrollReveal
      as="aside"
      className="plp-block plp-block--stl02 plp-quote"
      aria-label="Shop the look 02"
    >
      <div className="plp-quote__copy">
        <p className="plp-quote__text">
          “The 9060 doesn’t follow
          <br />
          the moment. It creates its own.”
        </p>
        <p className="plp-quote__attr">— Sydney McLaughlin</p>
      </div>
      <div className="plp-quote__media">
        <img
          className="plp-quote__img plp-lazy-media"
          src={assets.quoteEditorial}
          alt=""
        />
        <span className="plp-stl__add" aria-hidden="true">
          <span className="plp-stl__plus" />
        </span>
      </div>
    </ScrollReveal>
  );
}

function StlLead({
  src,
  label,
  blockClass,
  skeleton,
}: {
  src: string;
  label: string;
  blockClass: string;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <div className={`plp-block ${blockClass}`} aria-hidden="true">
        <section className="plp-stl">
          <div className="plp-stl__frame plp-stl__frame--skel">
            <div className="plp-skel plp-skel--stl" />
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className={`plp-block ${blockClass}`}>
      <ShopTheLook src={src} label={label} />
    </div>
  );
}

function LazyBatchView({
  batch,
  phase,
  showLeads = true,
  onProductSelect,
}: {
  batch: LazyBatchDef;
  phase: BatchPhase;
  /** false in 3-column view — shoes only, no Shop the Look / quote inserts */
  showLeads?: boolean;
  onProductSelect?: (product: ProductCard, productId: string) => void;
}) {
  const isSkeleton = phase === "skeleton";
  const reveal = phase === "reveal";

  return (
    <div
      className={
        reveal ? "plp-lazy-batch plp-lazy-batch--reveal" : "plp-lazy-batch"
      }
      data-phase={phase}
    >
      {showLeads ? (
        batch.lead.type === "quote" ? (
          <QuoteLead skeleton={isSkeleton} />
        ) : (
          <StlLead
            src={batch.lead.src}
            label={batch.lead.label}
            blockClass={batch.lead.blockClass}
            skeleton={isSkeleton}
          />
        )
      ) : null}
      {isSkeleton ? (
        <section
          className={`plp-block ${batch.sectionClass}`}
          aria-hidden="true"
        >
          <ProductGridSkeleton count={batch.products.length} />
        </section>
      ) : (
        <ScrollReveal
          className={`plp-block ${batch.sectionClass}`}
          aria-label={batch.sectionLabel}
          /* Done remounts after in-viewport settle — don't replay entrance */
          instantIfVisible={phase === "done"}
        >
          <ProductGrid
            products={batch.products}
            idPrefix={batch.idPrefix}
            reveal={reveal}
            onProductSelect={onProductSelect}
          />
        </ScrollReveal>
      )}
    </div>
  );
}

/**
 * 9060 PLP — Figma 85:2748 layout with one-time View More + progressive lazy load.
 * Footer remains global via AppLayout (after page content).
 */
type PlpEntryState = {
  fromHomepage?: boolean;
};

export default function Plp9060Page() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showNavigation, showPromoBar } = useScrollHeader();
  /** Sticky offset tracks shared header visibility — not a second scroll listener. */
  const toolbarStickyOffset = !showNavigation
    ? "none"
    : showPromoBar
      ? "header"
      : "nav";

  /**
   * One-shot hero image entrance when arriving from the Homepage 9060 CTA.
   * - pending: hold the frame invisible until the hero bitmap is ready
   * - run: play the CSS entrance (same motion as before)
   * Waiting on load/decode avoids finishing the 400ms fade before a cold
   * production asset paints (common on Vercel; rare with a warm local cache).
   */
  const [heroEnterPhase, setHeroEnterPhase] = useState<"off" | "pending" | "run">(
    () =>
      (location.state as PlpEntryState | null)?.fromHomepage ? "pending" : "off",
  );
  const heroImgRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    if (heroEnterPhase !== "pending") return;
    // Consume the flag so remounts / history replay don't re-run the entrance.
    navigate(".", { replace: true, state: null });
  }, [heroEnterPhase, navigate]);

  useEffect(() => {
    if (heroEnterPhase !== "pending") return;
    const img = heroImgRef.current;
    if (!img) return;

    let cancelled = false;
    const startEntrance = () => {
      if (cancelled) return;
      // Ensure one paint at the pending (hidden) styles before animating.
      requestAnimationFrame(() => {
        if (!cancelled) setHeroEnterPhase("run");
      });
    };

    const arm = () => {
      if (cancelled) return;
      if (typeof img.decode === "function") {
        img.decode().then(startEntrance, startEntrance);
      } else {
        startEntrance();
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      arm();
      return () => {
        cancelled = true;
      };
    }

    img.addEventListener("load", arm);
    img.addEventListener("error", startEntrance);
    return () => {
      cancelled = true;
      img.removeEventListener("load", arm);
      img.removeEventListener("error", startEntrance);
    };
  }, [heroEnterPhase]);

  const [hasExpanded, setHasExpanded] = useState(false);
  const [visibleBatchCount, setVisibleBatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMoreLoading, setIsViewMoreLoading] = useState(false);
  const [pendingBatchIndex, setPendingBatchIndex] = useState<number | null>(
    null,
  );
  const [pendingPhase, setPendingPhase] = useState<"skeleton" | "reveal" | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("two-column");
  const [isViewSwitching, setIsViewSwitching] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [appliedResultCount, setAppliedResultCount] = useState(0);
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedFilterSelection | null>(null);
  const [filterApplyNonce, setFilterApplyNonce] = useState(0);
  const [quickShopOpen, setQuickShopOpen] = useState(false);
  const [quickShopProduct, setQuickShopProduct] =
    useState<QuickShopProduct | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const filterToolbarRef = useRef<HTMLDivElement | null>(null);
  const quickShopTriggerRef = useRef<HTMLElement | null>(null);
  const resultsStartRef = useRef<HTMLElement | null>(null);
  const loadingGuardRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const pendingAnchorRef = useRef<ProductAnchor | null>(null);
  const filterLoadTimerRef = useRef<number | null>(null);

  const hasMoreContent = visibleBatchCount < LAZY_BATCHES.length;
  const busy = isLoading || isViewMoreLoading;
  const isThreeColumn = viewMode === "three-column";
  const showEditorialLeads = !isThreeColumn;
  const columnCount = isThreeColumn ? 3 : 2;

  /** Full product-only catalog (no editorial modules) for prototype filter Apply. */
  const allProductsOnly = useMemo(
    () => buildFlatProductItems(LAZY_BATCHES.length, null, null),
    [],
  );

  const filteredProducts = useMemo(
    () =>
      isFilterApplied
        ? withFixedQuickShopTestProduct(
            allProductsOnly,
            appliedResultCount,
            columnCount,
          )
        : [],
    [isFilterApplied, allProductsOnly, appliedResultCount, columnCount],
  );

  const activeFilterChips = useMemo(
    () => (appliedFilters ? buildActiveFilterChips(appliedFilters) : []),
    [appliedFilters],
  );
  const activeFilterCount = activeFilterChips.length;
  const filterSortLabel =
    isFilterApplied && activeFilterCount > 0
      ? `Filter & Sort (${activeFilterCount})`
      : "Filter & Sort";

  const productCapacity = allProductsOnly.length;

  /** One ordered product list for 3-col — avoids per-section grids leaving empty cells. */
  const flatThreeColItems = useMemo(
    () =>
      buildFlatProductItems(
        visibleBatchCount,
        pendingBatchIndex,
        pendingPhase,
      ),
    [visibleBatchCount, pendingBatchIndex, pendingPhase],
  );

  const threeColSkeletonCount =
    isThreeColumn &&
    pendingBatchIndex !== null &&
    pendingPhase === "skeleton"
      ? LAZY_BATCHES[pendingBatchIndex].products.length
      : 0;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return () => clearTimers();
  }, [clearTimers]);

  const startBatchLoad = useCallback(
    (index: number) => {
      if (loadingGuardRef.current) return;
      if (index < 0 || index >= LAZY_BATCHES.length) return;

      loadingGuardRef.current = true;
      setIsLoading(true);
      setPendingBatchIndex(index);
      setPendingPhase("skeleton");

      const toReveal = window.setTimeout(() => {
        setPendingPhase("reveal");
        const toComplete = window.setTimeout(() => {
          setVisibleBatchCount(index + 1);
          setPendingBatchIndex(null);
          setPendingPhase(null);
          setIsLoading(false);
          loadingGuardRef.current = false;
        }, BATCH_REVEAL_SETTLE_MS);
        timersRef.current.push(toComplete);
      }, BATCH_SKELETON_DELAY_MS);
      timersRef.current.push(toReveal);
    },
    [],
  );

  // Progressive lazy load after View More — sentinel sits above You May Like.
  useEffect(() => {
    if (isFilterApplied || !hasExpanded || !hasMoreContent || isLoading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (loadingGuardRef.current) return;
        startBatchLoad(visibleBatchCount);
      },
      { root: null, rootMargin: "0px 0px 500px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    isFilterApplied,
    hasExpanded,
    hasMoreContent,
    isLoading,
    startBatchLoad,
    visibleBatchCount,
  ]);

  const onViewMore = () => {
    if (hasExpanded || isViewMoreLoading) return;
    setIsViewMoreLoading(true);
    const id = window.setTimeout(() => {
      setIsViewMoreLoading(false);
      setHasExpanded(true);
      startBatchLoad(0);
    }, VIEW_MORE_DELAY_MS);
    timersRef.current.push(id);
  };

  const handleFilterApply = useCallback(
    (selection: AppliedFilterSelection) => {
      if (filterLoadTimerRef.current != null) {
        window.clearTimeout(filterLoadTimerRef.current);
        filterLoadTimerRef.current = null;
      }

      if (!selectionHasFilters(selection)) {
        // Cleared all filters — restore original PLP (editorial + View More sequence).
        setIsFilterLoading(false);
        setIsFilterApplied(false);
        setAppliedFilters(null);
        setAppliedResultCount(0);
        setFilterApplyNonce((n) => n + 1);
        return;
      }

      const count = Math.min(productCapacity, selection.resultCount);
      setIsFilterApplied(true);
      setAppliedFilters({ ...selection, resultCount: count });
      setAppliedResultCount(count);
      setIsFilterLoading(true);
      setFilterApplyNonce((n) => n + 1);
    },
    [productCapacity],
  );

  const handleClearAllFilters = useCallback(() => {
    if (filterLoadTimerRef.current != null) {
      window.clearTimeout(filterLoadTimerRef.current);
      filterLoadTimerRef.current = null;
    }
    setIsFilterLoading(false);
    setIsFilterApplied(false);
    setAppliedFilters(null);
    setAppliedResultCount(0);
    setFilterApplyNonce((n) => n + 1);
  }, []);

  const handleRemoveFilterChip = useCallback(
    (chip: ActiveFilterChip) => {
      if (!appliedFilters) return;

      const next = removeAppliedFilterChip(
        appliedFilters,
        chip,
        productCapacity,
      );

      if (!selectionHasFilters(next)) {
        handleClearAllFilters();
        return;
      }

      setAppliedFilters(next);
      setAppliedResultCount(next.resultCount);
    },
    [appliedFilters, handleClearAllFilters, productCapacity],
  );

  const handleProductSelect = useCallback(
    (product: ProductCard, productId: string) => {
      quickShopTriggerRef.current =
        (document.activeElement as HTMLElement | null) ?? null;

      const openWithColors = (
        colors?: Parameters<typeof toQuickShopProduct>[0]["colors"],
      ) => {
        setQuickShopProduct(
          toQuickShopProduct({
            id: productId,
            name: product.name,
            price: product.price,
            category: product.category,
            tagline: product.tagline,
            image: product.image,
            colors,
          }),
        );
        setQuickShopOpen(true);
      };

      // Dedicated PDP test product keeps Breakfast Tea defaults — do not resample.
      if (productId === QUICK_SHOP_TEST_PRODUCT_ID) {
        openWithColors();
        return;
      }

      void colorsFromShoeImage(product.image)
        .then((colors) => openWithColors(colors))
        .catch(() => openWithColors());
    },
    [],
  );

  const handleQuickShopClose = useCallback(() => {
    setQuickShopOpen(false);
  }, []);

  const setViewModePreservingScroll = useCallback(
    (next: ViewMode) => {
      if (next === viewMode) return;
      pendingAnchorRef.current = captureProductAnchor();
      setIsViewSwitching(true);
      setViewMode(next);
    },
    [viewMode],
  );

  useLayoutEffect(() => {
    const anchor = pendingAnchorRef.current;
    if (!anchor) return;
    pendingAnchorRef.current = null;
    restoreProductAnchor(anchor);
  }, [viewMode]);

  const scrollToFilterResults = useCallback(() => {
    const el = filterToolbarRef.current;
    if (!el) return;
    // Pin Filter & Sort at the top so the bar + applied chips stay in view.
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }, []);

  // After "See X items": wait for drawer unlock, show skeleton, then land on results.
  useEffect(() => {
    if (filterApplyNonce === 0 || filterOpen) return;

    if (filterLoadTimerRef.current != null) {
      window.clearTimeout(filterLoadTimerRef.current);
      filterLoadTimerRef.current = null;
    }

    if (!isFilterApplied) {
      setIsFilterLoading(false);
      return;
    }

    setIsFilterLoading(true);
    // Keep the filter section in view while the fake load runs.
    const prepId = window.setTimeout(() => {
      scrollToFilterResults();
    }, 0);

    const loadId = window.setTimeout(() => {
      setIsFilterLoading(false);
      filterLoadTimerRef.current = null;
      // After results paint, re-align so Filter & Sort + chips are fully visible.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToFilterResults();
        });
      });
    }, FILTER_SKELETON_DELAY_MS);
    filterLoadTimerRef.current = loadId;

    return () => {
      window.clearTimeout(prepId);
      window.clearTimeout(loadId);
    };
  }, [filterApplyNonce, filterOpen, isFilterApplied, scrollToFilterResults]);

  /*
   * 2-col → 3-col: layout switches immediately (data-view), image frames stay as
   * grey skeletons, then visible cards stagger in. Below-fold cards reveal via IO.
   * 3-col → 2-col keeps the short grid dim only.
   */
  useEffect(() => {
    if (!isViewSwitching) return;

    if (viewMode !== "three-column") {
      const id = window.setTimeout(() => setIsViewSwitching(false), 180);
      return () => window.clearTimeout(id);
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".plp[data-view='three-column'] .plp-card[data-product-id]",
      ),
    );

    let visibleIndex = 0;
    const deferred: HTMLElement[] = [];

    for (const card of cards) {
      card.classList.remove("plp-card--view-enter", "plp-card--view-skel");
      card.style.removeProperty("--plp-view-enter-delay");

      const rect = card.getBoundingClientRect();
      if (rect.bottom <= 0) {
        // Already above the viewport — show with the layout, no entrance.
        continue;
      }
      if (rect.top < window.innerHeight) {
        card.classList.add("plp-card--view-enter");
        card.style.setProperty(
          "--plp-view-enter-delay",
          reducedMotion ? "0ms" : `${visibleIndex * VIEW_ENTER_STAGGER_MS}ms`,
        );
        visibleIndex += 1;
      } else {
        card.classList.add("plp-card--view-skel");
        deferred.push(card);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const card = entry.target as HTMLElement;
          card.classList.remove("plp-card--view-skel");
          card.classList.add("plp-card--view-enter");
          card.style.setProperty("--plp-view-enter-delay", "0ms");
          observer.unobserve(card);
        }
      },
      { root: null, rootMargin: VIEW_ENTER_IO_ROOT_MARGIN, threshold: 0.01 },
    );
    for (const card of deferred) observer.observe(card);

    const visibleDuration = reducedMotion
      ? 120
      : Math.max(0, visibleIndex - 1) * VIEW_ENTER_STAGGER_MS +
        VIEW_ENTER_DURATION_MS;
    const doneId = window.setTimeout(() => {
      setIsViewSwitching(false);
    }, visibleDuration + 40);

    return () => {
      window.clearTimeout(doneId);
      observer.disconnect();
    };
  }, [isViewSwitching, viewMode]);

  return (
    <div
      className={
        isViewSwitching ? "plp plp--view-switching" : "plp"
      }
      data-view={viewMode}
      data-filter-applied={isFilterApplied ? "true" : undefined}
    >
      <GlobalNavigation variant="content" color="black" />

      <main className="plp__main">
        {/* —— Initial visible product content (before shop the look 02) —— */}
        <section className="plp-hero" aria-label="9060 Hero">
          <div className="plp-hero__media">
            <img
              ref={heroImgRef}
              className="plp-hero__img"
              src={assets.hero}
              alt=""
              data-enter={
                heroEnterPhase === "pending"
                  ? "pending"
                  : heroEnterPhase === "run"
                    ? "from-home"
                    : undefined
              }
            />
          </div>
          <div
            className="plp-hero__copy"
            data-enter={
              heroEnterPhase === "pending"
                ? "pending"
                : heroEnterPhase === "run"
                  ? "from-home"
                  : undefined
            }
          >
            <h1 className="plp-hero__title">9060</h1>
            <p className="plp-hero__subtitle">Bold by design</p>
          </div>
        </section>

        <ScrollReveal
          className="plp-discover"
          aria-label="Discover new colorways"
        >
          <div className="plp-discover__inner">
            <h2 className="plp-discover__title">
              Discover new
              <br />
              colorways
            </h2>
            <ul className="plp-discover__list">
              {DISCOVER.map((item) => {
                const pdpState = {
                  name: item.name,
                  price: item.price,
                  tagline: "Bouncy comfort for everyday miles",
                  image: item.image,
                  colorName: item.label,
                  colorSwatch: item.colorSwatch,
                } satisfies PdpEntryState;

                return (
                  <li key={item.id} className="plp-discover__item">
                    <Link
                      to={`/pdp/${item.id}`}
                      className="plp-discover__link"
                      state={pdpState}
                      aria-label={`${item.name}, ${item.label}, ${item.price}`}
                    >
                      <div className="plp-discover__media">
                        <img
                          className="plp-discover__img"
                          src={item.image}
                          alt=""
                        />
                      </div>
                      <div className="plp-discover__text">
                        <p className="plp-discover__label">{item.label}</p>
                        <p className="plp-discover__price">{item.price}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScrollReveal>

        <div
          ref={filterToolbarRef}
          className="plp-filter-results"
          data-filter-results={isFilterApplied ? "true" : undefined}
        >
          <div
            className="plp-toolbar"
            data-sticky-offset={toolbarStickyOffset}
            aria-label="Filter and sort"
          >
            <div className="plp-toolbar__sort">
              <button
                ref={filterTriggerRef}
                type="button"
                className="plp-toolbar__filter-btn"
                aria-haspopup="dialog"
                aria-expanded={filterOpen}
                aria-label={filterSortLabel}
                onClick={() => setFilterOpen(true)}
              >
                {filterSortLabel}
              </button>
            </div>
            <div className="plp-toolbar__views" role="group" aria-label="Product grid view">
              <button
                type="button"
                className="plp-view plp-view--2"
                data-active={viewMode === "two-column" ? "true" : undefined}
                aria-pressed={viewMode === "two-column"}
                aria-label="Two-column view"
                onClick={() => setViewModePreservingScroll("two-column")}
              />
              <button
                type="button"
                className="plp-view plp-view--3"
                data-active={viewMode === "three-column" ? "true" : undefined}
                aria-pressed={viewMode === "three-column"}
                aria-label="Three-column view"
                onClick={() => setViewModePreservingScroll("three-column")}
              />
            </div>
          </div>

          {isFilterApplied ? (
            <ActiveFilterChips
              chips={activeFilterChips}
              onRemove={handleRemoveFilterChip}
              onClearAll={handleClearAllFilters}
            />
          ) : null}

          {/*
            Product grids stay inside this wrapper so sticky Filter & Sort
            has a tall containing block (a short parent kills sticky).
          */}
          {isFilterApplied ? (
            isFilterLoading ? (
              <section
                ref={resultsStartRef}
                className="plp-block plp-block--plp01"
                aria-busy="true"
                aria-label={
                  appliedFilters
                    ? `Filtered products, ${appliedResultCount} items`
                    : "Filtered products"
                }
              >
                <ProductGridSkeleton
                  count={Math.min(
                    Math.max(columnCount * 3, 6),
                    Math.max(appliedResultCount, columnCount * 2),
                  )}
                />
              </section>
            ) : (
              <ScrollReveal
                ref={resultsStartRef}
                className="plp-block plp-block--plp01"
                aria-label={
                  appliedFilters
                    ? `Filtered products, ${appliedResultCount} items`
                    : "Filtered products"
                }
              >
                <ProductGrid
                  items={filteredProducts}
                  onProductSelect={handleProductSelect}
                />
              </ScrollReveal>
            )
          ) : isThreeColumn ? (
            /* Single continuous 3-col grid — product cards only as direct children */
            <ScrollReveal
              ref={resultsStartRef}
              className="plp-block plp-block--plp01"
              aria-label="Products"
            >
              <ProductGrid
                items={flatThreeColItems}
                skeletonCount={threeColSkeletonCount}
                onProductSelect={handleProductSelect}
              />
            </ScrollReveal>
          ) : (
            <>
              <ScrollReveal
                ref={resultsStartRef}
                className="plp-block plp-block--plp01"
                aria-label="Product section 01"
              >
                <ProductGrid
                  products={SECTION_01}
                  idPrefix="s01"
                  onProductSelect={handleProductSelect}
                />
              </ScrollReveal>

              {showEditorialLeads ? (
                <div className="plp-block plp-block--stl01">
                  <ShopTheLook src={assets.stl[0]} label="Shop the look 01" />
                </div>
              ) : null}

              <ScrollReveal
                className="plp-block plp-block--plp02"
                aria-label="Product section 02"
              >
                <ProductGrid
                  products={SECTION_02}
                  idPrefix="s02"
                  onProductSelect={handleProductSelect}
                />
              </ScrollReveal>
            </>
          )}

          {!isFilterApplied ? (
            <div className="plp-lazy-region" aria-busy={busy || undefined}>
              {busy ? (
                <span className="plp-visually-hidden">Loading more products</span>
              ) : null}

              {/* 2-col: sectioned batches with editorial leads. 3-col: products already flat above. */}
              {!isThreeColumn
                ? Array.from({ length: visibleBatchCount }, (_, i) => (
                    <LazyBatchView
                      key={LAZY_BATCHES[i].id}
                      batch={LAZY_BATCHES[i]}
                      phase="done"
                      showLeads={showEditorialLeads}
                      onProductSelect={handleProductSelect}
                    />
                  ))
                : null}

              {!isThreeColumn && pendingBatchIndex !== null && pendingPhase ? (
                <LazyBatchView
                  key={`${LAZY_BATCHES[pendingBatchIndex].id}-${pendingPhase}`}
                  batch={LAZY_BATCHES[pendingBatchIndex]}
                  phase={pendingPhase}
                  showLeads={showEditorialLeads}
                  onProductSelect={handleProductSelect}
                />
              ) : null}

              {/* One-time View More — outside the product grid */}
              {!hasExpanded ? (
                <div className="plp-view-more">
                  <button
                    type="button"
                    className="plp-view-more__btn"
                    aria-label={
                      isViewMoreLoading
                        ? "Loading more products"
                        : "View more products"
                    }
                    aria-busy={isViewMoreLoading || undefined}
                    disabled={isViewMoreLoading}
                    onClick={onViewMore}
                  >
                    {isViewMoreLoading ? <LoadingSpinner /> : "View More"}
                  </button>
                </div>
              ) : null}

              {/* Sentinel — full-width after the grid, never a grid cell */}
              {hasExpanded && hasMoreContent && !isLoading ? (
                <div
                  ref={sentinelRef}
                  className="plp-lazy-sentinel"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Final page modules (Footer is global in AppLayout after Outlet) */}
        <YouMayLike />
      </main>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleFilterApply}
        committedSelection={appliedFilters}
        returnFocusRef={filterTriggerRef}
      />

      <QuickShopDrawer
        open={quickShopOpen}
        onClose={handleQuickShopClose}
        product={quickShopProduct}
        returnFocusRef={quickShopTriggerRef}
      />
    </div>
  );
}
