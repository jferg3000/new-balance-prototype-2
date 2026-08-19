import { Link } from "react-router-dom";
import { useScrollHeader } from "../hooks/useScrollAwareHeader";
import { IconBag, IconLogo, IconMenu, IconSearch } from "./navIcons";
import "./GlobalNavigation.css";

export type GlobalNavigationVariant = "homepage" | "content";
export type GlobalNavigationColor = "white" | "black";

type GlobalNavigationProps = {
  /**
   * `homepage` — transparent overlay (Homepage / Collection).
   * `content` — frosted glass (PLP, PDP, category, other content pages).
   */
  variant?: GlobalNavigationVariant;
  /** Icon / logo color. */
  color?: GlobalNavigationColor;
  /** Optional bag badge count (e.g. PDP “1”). */
  bagCount?: number | string;
  /** Extra attributes for homepage intro hooks — unused by default. */
  "data-hero-enter"?: string;
};

/**
 * Shared site navigation — visual variants only.
 * Icons: Figma 158:316. Layout / color inheritance via `.site-nav` / `.nav`.
 */
export default function GlobalNavigation({
  variant = "homepage",
  color = "black",
  bagCount,
  "data-hero-enter": dataHeroEnter,
}: GlobalNavigationProps) {
  const { enabled, navMode } = useScrollHeader();
  const bagLabel =
    bagCount !== undefined ? `Bag, ${bagCount} item` : "Bag";

  return (
    <header
      className="site-nav nb-fixed-shell"
      data-nav-color={color}
      data-nav-variant={variant}
      data-header-nav={enabled ? navMode : undefined}
      data-hero-enter={dataHeroEnter}
    >
      <div className="nav">
        <button type="button" className="nav__menu" aria-label="Menu">
          <IconMenu tone={color} />
        </button>
        <Link to="/" className="nav__logo" aria-label="New Balance home">
          <IconLogo tone={color} />
        </Link>
        <div className="nav__actions">
          <button type="button" aria-label="Search">
            <IconSearch tone={color} />
          </button>
          <button
            type="button"
            className={bagCount !== undefined ? "nav__bag" : undefined}
            aria-label={bagLabel}
          >
            <IconBag tone={color} />
            {bagCount !== undefined ? (
              <span className="nav__bag-count" aria-hidden="true">
                {bagCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
