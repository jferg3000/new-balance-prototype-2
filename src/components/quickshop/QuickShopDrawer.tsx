import { useEffect, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import type { PdpEntryState } from "../../data/pdpProducts";
import FullScreenDrawer from "../drawers/FullScreenDrawer";
import "./QuickShopDrawer.css";

export type QuickShopColor = {
  id: string;
  label: string;
  /** CSS background for the 24×24 swatch (hex or gradient). */
  swatch: string;
};

export type QuickShopProduct = {
  id: string;
  name: string;
  price: string;
  /** Grey line under price — Figma tagline; falls back from category. */
  tagline: string;
  image: string;
  colors: QuickShopColor[];
  rating?: string;
  reviewCount?: string;
};

type QuickShopDrawerProps = {
  open: boolean;
  onClose: () => void;
  product: QuickShopProduct | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const DEFAULT_COLORS: QuickShopColor[] = [
  {
    id: "breakfast-tea",
    label: "Breakfast Tea with Angora",
    swatch:
      "linear-gradient(45deg, #fbfbfb 5%, #eceae9 28%, #dfdace 40%, #906337 59%)",
  },
  {
    id: "black",
    label: "Black with Sea Salt",
    swatch: "#151415",
  },
  {
    id: "grey",
    label: "Grey Day",
    swatch: "#9b9b9b",
  },
];

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function labelForTone(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const sat = max === 0 ? 0 : (max - min) / max;

  if (lum < 50) return "Black";
  if (sat < 0.12) {
    if (lum > 210) return "Sea Salt";
    if (lum > 150) return "Light Grey";
    return "Grey";
  }
  if (r > g && r > b && lum > 100) return "Warm Taupe";
  if (g > r && b > r) return "Cool Grey";
  if (lum > 180) return "Cream";
  return "Selected colorway";
}

/**
 * Sample non-background pixels from a PLP shoe image to build a diagonal
 * swatch that reads as the product colorway (prototype).
 */
export async function colorsFromShoeImage(
  imageSrc: string,
): Promise<QuickShopColor[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Failed to load ${imageSrc}`));
    el.src = imageSrc;
  });

  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [DEFAULT_COLORS[1], DEFAULT_COLORS[2]];

  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let lightR = 0;
  let lightG = 0;
  let lightB = 0;
  let lightN = 0;
  let darkR = 0;
  let darkG = 0;
  let darkB = 0;
  let darkN = 0;
  let midR = 0;
  let midG = 0;
  let midB = 0;
  let midN = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 0;
    if (a < 200) continue;

    // Skip near-black studio background and pure white blowouts.
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    if (lum < 28 || lum > 245) continue;

    midR += r;
    midG += g;
    midB += b;
    midN += 1;

    if (lum >= 150) {
      lightR += r;
      lightG += g;
      lightB += b;
      lightN += 1;
    } else {
      darkR += r;
      darkG += g;
      darkB += b;
      darkN += 1;
    }
  }

  if (midN === 0) {
    return [
      {
        id: "shoe",
        label: "Selected colorway",
        swatch: "#cfcfcf",
      },
      DEFAULT_COLORS[1],
      DEFAULT_COLORS[2],
    ];
  }

  const avg = (sum: number, n: number, fallback: number) =>
    n > 0 ? sum / n : fallback;
  const midRf = midR / midN;
  const midGf = midG / midN;
  const midBf = midB / midN;

  const lightHex = rgbToHex(
    avg(lightR, lightN, Math.min(255, midRf + 35)),
    avg(lightG, lightN, Math.min(255, midGf + 35)),
    avg(lightB, lightN, Math.min(255, midBf + 35)),
  );
  const darkHex = rgbToHex(
    avg(darkR, darkN, Math.max(0, midRf - 40)),
    avg(darkG, darkN, Math.max(0, midGf - 40)),
    avg(darkB, darkN, Math.max(0, midBf - 40)),
  );

  const swatch = `linear-gradient(45deg, ${lightHex} 12%, ${darkHex} 68%)`;

  return [
    {
      id: "shoe",
      label: labelForTone(midRf, midGf, midBf),
      swatch,
    },
    DEFAULT_COLORS[1],
    DEFAULT_COLORS[2],
  ];
}

/** Map a PLP card into Quick Shop product data (prototype defaults for color). */
export function toQuickShopProduct(input: {
  id: string;
  name: string;
  price: string;
  category?: string;
  image: string;
  colors?: QuickShopColor[];
  tagline?: string;
}): QuickShopProduct {
  return {
    id: input.id,
    name: input.name,
    price: input.price,
    tagline: input.tagline ?? input.category ?? "Bouncy comfort for everyday miles",
    image: input.image,
    colors: input.colors?.length ? input.colors : DEFAULT_COLORS,
    rating: "4.5",
    reviewCount: "207",
  };
}

function IconClose() {
  return (
    <img
      className="qs-drawer__icon"
      src="/assets/quickshop/icon-close.svg"
      alt=""
      width={24}
      height={24}
      aria-hidden="true"
    />
  );
}

function IconChevron() {
  return (
    <img
      className="qs-drawer__icon"
      src="/assets/quickshop/icon-chevron.svg"
      alt=""
      width={24}
      height={24}
      aria-hidden="true"
    />
  );
}

function IconStar() {
  return (
    <img
      className="qs-drawer__star"
      src="/assets/quickshop/icon-star.svg"
      alt=""
      width={10}
      height={10}
      aria-hidden="true"
    />
  );
}

/**
 * Quick Shop — Figma 114:827
 * Full-screen overlay on PLP via FullScreenDrawer. Local color state only.
 */
export default function QuickShopDrawer({
  open,
  onClose,
  product,
  returnFocusRef,
}: QuickShopDrawerProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);

  const colors = product?.colors ?? DEFAULT_COLORS;
  const selected =
    colors.find((c) => c.id === selectedColorId) ?? colors[0] ?? null;

  useEffect(() => {
    if (!open || !product) return;
    setSelectedColorId(product.colors[0]?.id ?? null);
    setColorMenuOpen(false);
  }, [open, product]);

  /* Keep last product mounted during close animation. */
  if (!product) return null;

  const rating = product.rating ?? "4.5";
  const reviewCount = product.reviewCount ?? "207";

  return (
    <FullScreenDrawer
      open={open}
      onClose={onClose}
      title={`${product.name} quick shop`}
      returnFocusRef={returnFocusRef}
    >
      <div className="qs-drawer">
        <button
          type="button"
          className="qs-drawer__close"
          aria-label="Close quick shop"
          onClick={onClose}
        >
          <IconClose />
        </button>

        <div className="qs-drawer__body">
          <header className="qs-drawer__title">
            <div className="qs-drawer__title-main">
              <h2 className="qs-drawer__name">{product.name}</h2>
              <p className="qs-drawer__price">{product.price}</p>
            </div>
            <p className="qs-drawer__tagline">{product.tagline}</p>
          </header>

          <div className="qs-drawer__media">
            <img
              className="qs-drawer__img"
              src={product.image}
              alt=""
            />
          </div>

          <div className="qs-drawer__meta-row">
            <div className="qs-drawer__indicator" aria-hidden="true">
              <span className="qs-drawer__indicator-seg qs-drawer__indicator-seg--active" />
              <span className="qs-drawer__indicator-seg" />
            </div>
            <div className="qs-drawer__reviews">
              <IconStar />
              <span className="qs-drawer__rating">{rating}</span>
              <span className="qs-drawer__review-count">
                (<span>(</span>
                <span className="qs-drawer__review-link">{reviewCount}</span>
                <span>)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="qs-drawer__footer">
          <div className="qs-drawer__ctas">
            <div className="qs-drawer__color">
              <button
                type="button"
                className="qs-drawer__color-trigger"
                aria-haspopup="listbox"
                aria-expanded={false}
                aria-disabled="true"
                tabIndex={-1}
                aria-label={`Color: ${selected?.label ?? "Select color"}`}
                onClick={(e) => e.preventDefault()}
              >
                <span className="qs-drawer__swatch-wrap">
                  <span
                    className="qs-drawer__swatch"
                    style={{ background: selected?.swatch }}
                  />
                  <span className="qs-drawer__color-label">
                    {selected?.label}
                  </span>
                </span>
                <IconChevron />
              </button>
              {colorMenuOpen ? (
                <ul className="qs-drawer__color-menu" role="listbox">
                  {colors.map((color) => (
                    <li key={color.id} role="option" aria-selected={color.id === selected?.id}>
                      <button
                        type="button"
                        className="qs-drawer__color-option"
                        data-selected={
                          color.id === selected?.id ? "true" : undefined
                        }
                        onClick={() => {
                          setSelectedColorId(color.id);
                          setColorMenuOpen(false);
                        }}
                      >
                        <span
                          className="qs-drawer__swatch"
                          style={{ background: color.swatch }}
                        />
                        <span className="qs-drawer__color-label">
                          {color.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button type="button" className="qs-drawer__add">
              Add to bag
            </button>
          </div>

          <Link
            to={`/pdp/${product.id}`}
            className="qs-drawer__details"
            state={
              {
                fromQuickShop: true,
                name: product.name,
                price: product.price,
                tagline: product.tagline,
                image: product.image,
                colorName: selected?.label,
                colorSwatch: selected?.swatch,
              } satisfies PdpEntryState
            }
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            }}
          >
            View full details
          </Link>
        </div>
      </div>
    </FullScreenDrawer>
  );
}
