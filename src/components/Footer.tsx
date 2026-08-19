import "./Footer.css";

const assets = {
  logoFooter: "/assets/logo-footer.svg",
  plus: "/assets/icon-plus-small.svg",
};

const LINK_SECTIONS = ["Shop", "For You", "About us", "Help"] as const;

const SOCIAL_LINKS = [
  "Instagram",
  "Facebook",
  "X",
  "YouTube",
  "TikTok",
] as const;

const LEGAL_LINKS = [
  "Privacy Policy",
  "Responsible Disclosure",
  "Website Terms & Conditions",
  "CA Supply Chains Act (SB 657) and Modern Slavery Act Statement",
  "Health Data Privacy Policy",
  "Do Not Sell or Share My Personal Information",
] as const;

/**
 * Global Footer — exact Footer 08/19 from new-balance-prototype-1
 * (`motion-study-1`, Figma 16205:186).
 * Keeps `data-global-footer` / `data-nav-color` for this prototype's chrome.
 */
export function Footer() {
  return (
    <footer
      className="footer"
      data-global-footer
      data-nav-color="black"
      data-component="Footer"
      data-node-id="16205:186"
    >
      <div className="footer__signup">
        <p>Sign up to be the first to know about new arrivals</p>
        <button type="button" className="footer__signup-btn">
          Sign up
        </button>
      </div>

      <nav className="footer__nav" aria-label="Footer">
        {LINK_SECTIONS.map((label, index) => (
          <div
            key={label}
            className={
              index === 0
                ? "footer__section"
                : "footer__section footer__section--spaced"
            }
          >
            <div className="footer__row">
              <p>{label}</p>
              <span className="footer__plus" aria-hidden>
                <img src={assets.plus} alt="" width={16} height={16} />
              </span>
            </div>
            <div className="footer__rule" />
          </div>
        ))}
      </nav>

      <div className="footer__logo">
        <img
          src={assets.logoFooter}
          alt="New Balance"
          width={68}
          height={33}
        />
      </div>

      <ul className="footer__social">
        {SOCIAL_LINKS.map((label) => (
          <li key={label}>
            <a href="#">{label}</a>
          </li>
        ))}
      </ul>

      <div className="footer__legal">
        {LEGAL_LINKS.map((label) => (
          <a key={label} href="#">
            {label}
          </a>
        ))}
      </div>

      <p className="footer__copy">© Copyright New Balance 2026</p>
    </footer>
  );
}
