/**
 * Main-nav glyphs. Menu uses the dropped motion-study-3 asset
 * `public/assets/Menu Black.svg` at native 22×8.
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
          : "/assets/Menu Black.svg"
      }
      alt=""
      width={22}
      height={8}
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
