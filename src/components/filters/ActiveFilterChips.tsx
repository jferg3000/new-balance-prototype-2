import "./ActiveFilterChips.css";

export type ActiveFilterGroup = "sort" | "gender" | "price" | "color";

export type ActiveFilterChip = {
  id: string;
  group: ActiveFilterGroup;
  value: string;
  label: string;
  /** Present for color chips — CSS hex for the swatch square. */
  swatchHex?: string;
};

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
  onRemove: (chip: ActiveFilterChip) => void;
  onClearAll: () => void;
};

function ChipCloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M1.76 1.76l8.48 8.48M10.24 1.76l-8.48 8.48"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

/** Figma 112:798 — active filter chips below Filter & Sort. */
export default function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <ul className="plp-active-filters" aria-label="Active filters">
      {chips.map((chip) => {
        const isWhiteSwatch =
          chip.swatchHex?.toLowerCase() === "#ffffff" ||
          chip.swatchHex?.toLowerCase() === "#fff";

        return (
          <li key={chip.id} className="plp-active-filters__chip">
            {chip.group === "color" && chip.swatchHex ? (
              <span
                className={
                  isWhiteSwatch
                    ? "plp-active-filters__swatch plp-active-filters__swatch--white"
                    : "plp-active-filters__swatch"
                }
                style={isWhiteSwatch ? undefined : { background: chip.swatchHex }}
                aria-hidden="true"
              />
            ) : null}
            <span className="plp-active-filters__label">{chip.label}</span>
            <button
              type="button"
              className="plp-active-filters__remove"
              aria-label={`Remove ${chip.label} filter`}
              onClick={() => onRemove(chip)}
            >
              <ChipCloseIcon />
            </button>
          </li>
        );
      })}
      <li className="plp-active-filters__chip plp-active-filters__chip--clear">
        <button
          type="button"
          className="plp-active-filters__clear"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}
