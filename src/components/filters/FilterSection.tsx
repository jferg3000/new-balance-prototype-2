import type { ReactNode } from "react";
import "./FilterSection.css";

type FilterSectionProps = {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
  /** Sort-by block has no accordion chrome in Figma. */
  alwaysOpen?: boolean;
};

function IconMinus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M0 6h12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M0 6h12M6 0v12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export default function FilterSection({
  id,
  title,
  expanded,
  onToggle,
  children,
  alwaysOpen = false,
}: FilterSectionProps) {
  const open = alwaysOpen || expanded;
  const panelId = `${id}-panel`;

  return (
    <section
      className={[
        open ? "fd-section fd-section--open" : "fd-section fd-section--closed",
        alwaysOpen ? "fd-section--sort" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-section={id}
    >
      {alwaysOpen ? (
        <h3 className="fd-section__title fd-section__title--static">{title}</h3>
      ) : (
        <button
          type="button"
          className="fd-section__heading"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="fd-section__title">{title}</span>
          <span className="fd-section__icon" aria-hidden="true">
            {open ? <IconMinus /> : <IconPlus />}
          </span>
        </button>
      )}
      {open && children != null ? (
        <div
          id={alwaysOpen ? undefined : panelId}
          className="fd-section__body"
          role={alwaysOpen ? undefined : "region"}
          aria-label={alwaysOpen ? undefined : title}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
