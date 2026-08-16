import "./FilterCheckbox.css";

type FilterCheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  /** Radio-like single-select within a name group. */
  exclusive?: boolean;
};

export default function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
  name,
  exclusive = false,
}: FilterCheckboxProps) {
  return (
    <label className="fd-check" htmlFor={id}>
      <input
        id={id}
        className="fd-check__input"
        type={exclusive ? "radio" : "checkbox"}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="fd-check__box" aria-hidden="true" />
      <span className="fd-check__label">{label}</span>
    </label>
  );
}
