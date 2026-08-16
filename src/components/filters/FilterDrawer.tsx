import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullScreenDrawer from "../drawers/FullScreenDrawer";
import type { ActiveFilterChip, ActiveFilterGroup } from "./ActiveFilterChips";
import ColorOption, { type ColorSwatch } from "./ColorOption";
import FilterCheckbox from "./FilterCheckbox";
import FilterSection from "./FilterSection";
import "./FilterDrawer.css";

export const SORT_OPTIONS = [
  { id: "new", label: "New arrivals" },
  { id: "popular", label: "Most popular" },
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price low to high" },
  { id: "price-desc", label: "Price high to low" },
] as const;

export const GENDER_OPTIONS = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "unisex", label: "Unisex" },
  { id: "kids", label: "Kids" },
] as const;

export const PRICE_OPTIONS = [
  { id: "50-74", label: "$50 - $74.99" },
  { id: "75-99", label: "$75 - $99.99" },
  { id: "100-129", label: "$100 - $129.99" },
  { id: "125-149", label: "$125 - $149.99" },
  { id: "150-174", label: "$150 - $174.99" },
] as const;

/** Figma Color section — left column then right column order. */
export const COLOR_OPTIONS: ColorSwatch[] = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "tan", label: "Tan", hex: "#dbb790" },
  { id: "black", label: "Black", hex: "#000000" },
  { id: "grey-1", label: "Grey", hex: "#9b9b9b" },
  { id: "green", label: "Green", hex: "#00a055" },
  { id: "brown", label: "Brown", hex: "#523225" },
  { id: "blue", label: "Blue", hex: "#004f8e" },
  { id: "purple", label: "Purple", hex: "#715ba1" },
  { id: "grey-2", label: "Grey", hex: "#9b9b9b" },
  { id: "yellow", label: "Yellow", hex: "#f9ee69" },
];

const COLLAPSED_SECTIONS = [
  { id: "adult-size", title: "Adult Footwear Size" },
  { id: "big-kid", title: "Big Kid Size" },
  { id: "little-kid", title: "Little Kid Size" },
  { id: "baby", title: "Baby to Toddler Size" },
  { id: "closure", title: "Closure" },
  { id: "width", title: "Width" },
] as const;

/** Prototype-only baseline — not a real catalog count. */
const FAKE_BASE_COUNT = 63;
const FAKE_MIN_COUNT = 10;

type AccordionId =
  | "gender"
  | "price"
  | "color"
  | "adult-size"
  | "big-kid"
  | "little-kid"
  | "baby"
  | "closure"
  | "width";

export type AppliedFilterSelection = {
  sort: string | null;
  genders: string[];
  prices: string[];
  colors: string[];
  resultCount: number;
};

type FilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Commit draft filters + fake count to the PLP (prototype Apply). */
  onApply: (selection: AppliedFilterSelection) => void;
  /** Applied PLP selection — keeps drawer draft in sync when chips are removed. */
  committedSelection?: AppliedFilterSelection | null;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M1.76 1.76l8.48 8.48M10.24 1.76l-8.48 8.48"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

const DEFAULT_EXPANDED: Record<AccordionId, boolean> = {
  gender: true,
  price: true,
  color: true,
  "adult-size": false,
  "big-kid": false,
  "little-kid": false,
  baby: false,
  closure: false,
  width: false,
};

/** Deterministic fake reduction per token so selects/deselects feel stable. */
function tokenWeight(token: string, base: number, span: number) {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash + token.charCodeAt(i) * (i + 3)) % 97;
  }
  return base + (hash % (span + 1));
}

export function selectionHasFilters(selection: {
  sort: string | null;
  genders: string[];
  prices: string[];
  colors: string[];
}) {
  return (
    Boolean(selection.sort) ||
    selection.genders.length > 0 ||
    selection.prices.length > 0 ||
    selection.colors.length > 0
  );
}

/**
 * Prototype fake result count. Deterministic from active filter tokens.
 * Optionally capped to available product capacity.
 */
export function computeFakeResultCount(
  sort: string | null,
  genders: string[],
  prices: string[],
  colors: string[],
  maxCount?: number,
) {
  let count = FAKE_BASE_COUNT;
  if (sort) count -= tokenWeight(sort, 6, 4);
  for (const id of genders) count -= tokenWeight(id, 5, 5);
  for (const id of prices) count -= tokenWeight(id, 7, 5);
  for (const id of colors) count -= tokenWeight(id, 4, 6);
  const floored = Math.max(FAKE_MIN_COUNT, count);
  return maxCount != null ? Math.min(maxCount, floored) : floored;
}

function labelFor(group: ActiveFilterGroup, value: string): string | null {
  if (group === "sort") {
    return SORT_OPTIONS.find((o) => o.id === value)?.label ?? null;
  }
  if (group === "gender") {
    return GENDER_OPTIONS.find((o) => o.id === value)?.label ?? null;
  }
  if (group === "price") {
    return PRICE_OPTIONS.find((o) => o.id === value)?.label ?? null;
  }
  return COLOR_OPTIONS.find((o) => o.id === value)?.label ?? null;
}

/** Flatten applied filter values into chip display items (group + value ids). */
export function buildActiveFilterChips(
  selection: AppliedFilterSelection,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (selection.sort) {
    const label = labelFor("sort", selection.sort);
    if (label) {
      chips.push({
        id: `sort:${selection.sort}`,
        group: "sort",
        value: selection.sort,
        label,
      });
    }
  }

  for (const value of selection.genders) {
    const label = labelFor("gender", value);
    if (label) {
      chips.push({ id: `gender:${value}`, group: "gender", value, label });
    }
  }

  for (const value of selection.prices) {
    const label = labelFor("price", value);
    if (label) {
      chips.push({ id: `price:${value}`, group: "price", value, label });
    }
  }

  for (const value of selection.colors) {
    const color = COLOR_OPTIONS.find((o) => o.id === value);
    if (color) {
      chips.push({
        id: `color:${value}`,
        group: "color",
        value,
        label: color.label,
        swatchHex: color.hex,
      });
    }
  }

  return chips;
}

/** Remove one chip value and recompute fake count (prototype). */
export function removeAppliedFilterChip(
  selection: AppliedFilterSelection,
  chip: Pick<ActiveFilterChip, "group" | "value">,
  maxCount?: number,
): AppliedFilterSelection {
  const next: AppliedFilterSelection = {
    sort: chip.group === "sort" ? null : selection.sort,
    genders:
      chip.group === "gender"
        ? selection.genders.filter((v) => v !== chip.value)
        : [...selection.genders],
    prices:
      chip.group === "price"
        ? selection.prices.filter((v) => v !== chip.value)
        : [...selection.prices],
    colors:
      chip.group === "color"
        ? selection.colors.filter((v) => v !== chip.value)
        : [...selection.colors],
    resultCount: selection.resultCount,
  };
  next.resultCount = computeFakeResultCount(
    next.sort,
    next.genders,
    next.prices,
    next.colors,
    maxCount,
  );
  return next;
}

function syncDraftFromCommitted(
  selection: AppliedFilterSelection | null | undefined,
  setSort: (v: string | null) => void,
  setGenders: (v: string[]) => void,
  setPrices: (v: string[]) => void,
  setColors: (v: string[]) => void,
) {
  if (selection && selectionHasFilters(selection)) {
    setSort(selection.sort);
    setGenders([...selection.genders]);
    setPrices([...selection.prices]);
    setColors([...selection.colors]);
    return;
  }
  setSort(null);
  setGenders([]);
  setPrices([]);
  setColors([]);
}

export default function FilterDrawer({
  open,
  onClose,
  onApply,
  committedSelection = null,
  returnFocusRef,
}: FilterDrawerProps) {
  const [expanded, setExpanded] = useState(DEFAULT_EXPANDED);
  const [sort, setSort] = useState<string | null>(null);
  const [genders, setGenders] = useState<string[]>([]);
  const [prices, setPrices] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const committedRef = useRef(committedSelection);
  committedRef.current = committedSelection;

  const resultCount = useMemo(
    () => computeFakeResultCount(sort, genders, prices, colors),
    [sort, genders, prices, colors],
  );

  const hasDraftSelection = selectionHasFilters({
    sort,
    genders,
    prices,
    colors,
  });

  // Keep draft aligned with applied chips when drawer is closed (chip remove).
  useEffect(() => {
    if (open) return;
    syncDraftFromCommitted(
      committedSelection,
      setSort,
      setGenders,
      setPrices,
      setColors,
    );
  }, [committedSelection, open]);

  // On open, load the latest committed selection into the draft.
  useEffect(() => {
    if (!open) return;
    syncDraftFromCommitted(
      committedRef.current,
      setSort,
      setGenders,
      setPrices,
      setColors,
    );
  }, [open]);

  const handleApply = useCallback(() => {
    onApply({
      sort,
      genders: [...genders],
      prices: [...prices],
      colors: [...colors],
      resultCount,
    });
    onClose();
  }, [onApply, onClose, sort, genders, prices, colors, resultCount]);

  const handleReset = useCallback(() => {
    setSort(null);
    setGenders([]);
    setPrices([]);
    setColors([]);
  }, []);

  const toggleSection = useCallback((id: AccordionId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleMulti = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    id: string,
    next: boolean,
  ) => {
    setList(next ? [...list, id] : list.filter((x) => x !== id));
  };

  return (
    <FullScreenDrawer
      open={open}
      onClose={onClose}
      title="Filter & Sort"
      returnFocusRef={returnFocusRef}
    >
      <div className="fd-drawer">
        <header className="fd-drawer__header">
          <p className="fd-drawer__header-label">Filter & Sort</p>
          <button
            type="button"
            className="fd-drawer__close"
            aria-label="Close filters"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </header>

        <div className="fd-drawer__scroll">
          <div className="fd-drawer__scroll-inner">
            <FilterSection
              id="sort"
              title="Sort by"
              expanded
              alwaysOpen
              onToggle={() => undefined}
            >
              <ul className="fd-list fd-list--stack">
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <FilterCheckbox
                      id={`sort-${opt.id}`}
                      name="plp-sort"
                      exclusive
                      label={opt.label}
                      checked={sort === opt.id}
                      onChange={(checked) =>
                        setSort(checked ? opt.id : null)
                      }
                    />
                  </li>
                ))}
              </ul>
            </FilterSection>

            <FilterSection
              id="gender"
              title="Gender"
              expanded={expanded.gender}
              onToggle={() => toggleSection("gender")}
            >
              <ul className="fd-list fd-list--gender">
                {GENDER_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <FilterCheckbox
                      id={`gender-${opt.id}`}
                      label={opt.label}
                      checked={genders.includes(opt.id)}
                      onChange={(checked) =>
                        toggleMulti(genders, setGenders, opt.id, checked)
                      }
                    />
                  </li>
                ))}
              </ul>
            </FilterSection>

            <FilterSection
              id="price"
              title="Price"
              expanded={expanded.price}
              onToggle={() => toggleSection("price")}
            >
              <ul className="fd-list fd-list--price">
                {PRICE_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <FilterCheckbox
                      id={`price-${opt.id}`}
                      label={opt.label}
                      checked={prices.includes(opt.id)}
                      onChange={(checked) =>
                        toggleMulti(prices, setPrices, opt.id, checked)
                      }
                    />
                  </li>
                ))}
              </ul>
            </FilterSection>

            <FilterSection
              id="color"
              title="Color"
              expanded={expanded.color}
              onToggle={() => toggleSection("color")}
            >
              <ul className="fd-list fd-list--color">
                {COLOR_OPTIONS.map((opt) => (
                  <li key={opt.id}>
                    <ColorOption
                      option={opt}
                      checked={colors.includes(opt.id)}
                      onChange={(checked) =>
                        toggleMulti(colors, setColors, opt.id, checked)
                      }
                    />
                  </li>
                ))}
              </ul>
            </FilterSection>

            {COLLAPSED_SECTIONS.map((section) => (
              <FilterSection
                key={section.id}
                id={section.id}
                title={section.title}
                expanded={expanded[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>

        <footer className="fd-drawer__footer">
          <button type="button" className="fd-drawer__cta" onClick={handleApply}>
            <span className="fd-drawer__cta-count" key={resultCount}>
              {`See ${resultCount} items`}
            </span>
          </button>
          {hasDraftSelection ? (
            <button
              type="button"
              className="fd-drawer__reset"
              onClick={handleReset}
            >
              Reset
            </button>
          ) : null}
        </footer>
      </div>
    </FullScreenDrawer>
  );
}
