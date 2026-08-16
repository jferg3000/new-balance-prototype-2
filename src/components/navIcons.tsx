/**
 * Main-nav glyphs — Figma 158:316 (Nav Bar).
 * Strokes/fills use currentColor so data-nav-color can switch black/white.
 */

export function IconMenu() {
  return (
    <svg
      width="22"
      height="9.25"
      viewBox="0 0 22 9.24987"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="8.62486"
        x2="13"
        y2="8.62487"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line
        x1="4"
        y1="4.62486"
        x2="18"
        y2="4.62486"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line
        x1="8"
        y1="0.625"
        x2="22"
        y2="0.625"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function IconLogo() {
  return (
    <svg
      width="38"
      height="18"
      viewBox="0 0 38 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.26197 12.4199L2.41909 13.8589L10.832 14.3272L12.3534 11.7391L3.26109 12.4199H3.26197ZM18.4347 3.49867L8.10103 4.13938L7.25815 5.58098L19.1981 6.35402L18.4347 3.49867ZM17.5079 0.00609373L10.5201 0L9.68077 1.43899L18.0354 1.95609L17.5079 0.00609373ZM0.842882 16.561L0 18L8.69299 17.9913L9.90872 15.9351L0.842882 16.561ZM33.2258 0H22.976L21.6843 2.21202L27.2117 2.59158L27.0014 2.95894L21.0288 3.33501L19.2626 6.35402L24.8067 6.70745L24.5938 7.07221L5.68106 8.28138L4.83818 9.72037L22.4106 10.812L22.1977 11.1742L12.4179 11.7374L13.1583 14.4717L20.0295 14.8852L19.8166 15.25L13.479 15.6896L14.0737 17.9956L26.1744 17.9896C29.0865 17.9896 34.3249 16.0909 34.9345 12.1048C35.2756 9.85878 33.2903 8.99086 32.4916 8.89684C36.2492 7.85394 37.5286 5.36422 37.8025 4.37617C38.709 1.10906 36.3773 0 33.2258 0ZM28.1747 12.224C27.6614 13.5255 25.9968 13.9816 25.07 13.9816H23.0644L25.1689 10.3881H27.1684C27.7745 10.3881 28.6492 11.0114 28.1738 12.2231L28.1747 12.224ZM31.745 5.34507C31.3024 6.4106 30.0866 6.93379 28.923 6.93901L27.1772 6.95033L29.1828 3.51782L30.8739 3.52043C31.6054 3.51782 32.1532 4.35876 31.7459 5.3442L31.745 5.34507Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * Figma 158:318 IconShoppingBag vector — centered in the 16.5 frame so
 * stroke stays 1.25 (matches search) without scaling the exported glyph.
 */
export function IconBag() {
  return (
    <svg
      className="nav__icon-bag"
      width="16.5"
      height="16.5"
      viewBox="0 0 16.5 16.5"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(2.29165 2.29165)">
        <path
          d="M3.21086 4.95801V0.625H8.70581C8.70581 0.625 8.70581 3.06456 8.70581 4.95801M0.625 3.21086H11.2917V11.2917H0.625V3.21086Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="square"
        />
      </g>
    </svg>
  );
}
