import "./ColorOption.css";

export type ColorSwatch = {
  id: string;
  label: string;
  /** CSS color; white uses border-only swatch. */
  hex: string;
};

type ColorOptionProps = {
  option: ColorSwatch;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Color row: 14px swatch control + label (Figma Color section). */
export default function ColorOption({
  option,
  checked,
  onChange,
}: ColorOptionProps) {
  const isWhite = option.hex.toLowerCase() === "#ffffff";

  return (
    <label className="fd-color" htmlFor={`color-${option.id}`}>
      <input
        id={`color-${option.id}`}
        className="fd-color__input"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={
          isWhite ? "fd-color__swatch fd-color__swatch--white" : "fd-color__swatch"
        }
        style={isWhite ? undefined : { background: option.hex }}
        aria-hidden="true"
      />
      <span className="fd-color__label">{option.label}</span>
    </label>
  );
}
