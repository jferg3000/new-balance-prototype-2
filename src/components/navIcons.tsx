/**
 * Main-nav glyphs — exact Global/ assets from prototype-1 motion-study-1.
 * Menu is 22×8 (black) / 22×10 (white), drawn at 22×10 like Nav.tsx.
 */

export type NavIconTone = "black" | "white";

type ToneProps = {
  tone?: NavIconTone;
};

export function IconMenu({ tone = "black" }: ToneProps) {
  return (
    <img
      className="nav__menu-icon"
      src={
        tone === "white"
          ? "/assets/nav/menu-white.svg"
          : "/assets/nav/menu-black.svg"
      }
      alt=""
      width={22}
      height={10}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function IconLogo({ tone = "black" }: ToneProps) {
  return (
    <img
      className="nav__logo-icon"
      src={
        tone === "white"
          ? "/assets/nav/logo-white.svg"
          : "/assets/nav/logo-black.svg"
      }
      alt=""
      width={44}
      height={21}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function IconSearch({ tone = "black" }: ToneProps) {
  return (
    <img
      src={
        tone === "white"
          ? "/assets/nav/search-white.svg"
          : "/assets/nav/search-black.svg"
      }
      alt=""
      width={16}
      height={16}
      draggable={false}
      aria-hidden="true"
    />
  );
}

export function IconBag({ tone = "black" }: ToneProps) {
  return (
    <img
      className="nav__icon-bag"
      src={
        tone === "white"
          ? "/assets/nav/bag-white.svg"
          : "/assets/nav/bag-black.svg"
      }
      alt=""
      width={16}
      height={16}
      draggable={false}
      aria-hidden="true"
    />
  );
}
