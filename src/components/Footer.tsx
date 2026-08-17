import "./Footer.css";

const assets = {
  logoFooter: "/assets/logo-footer.svg",
  brandBrine: "/assets/brand-brine.svg",
  brandWarrior: "/assets/brand-warrior.svg",
  brandTeamSports: "/assets/brand-team-sports.svg",
  arrow: "/assets/icon-arrow.svg",
  plus: "/assets/icon-plus-small.svg",
};

const LINK_SECTIONS = ["Help", "Shop", "About us", "For you"] as const;

const SOCIAL_LEFT = ["Instagram", "Facebook", "X"] as const;
const SOCIAL_RIGHT = ["YouTube", "Pinterest", "TikTok"] as const;

const LEGAL_LINKS = [
  "Privacy Policy",
  "Responsible Disclosure",
  "Website Terms & Conditions",
  "CA Supply Chains Act (SB 657) and Modern Slavery Act Statement",
  "Health Data Privacy Policy",
  "Do Not Sell or Share My Personal Information",
] as const;

/**
 * Global Footer — exact Footer 08/13 from new-balance-prototype-1
 * (`motion-study-1`, Figma 16017:417).
 * Keeps `data-global-footer` / `data-nav-color` for this prototype's chrome.
 */
export function Footer() {
  return (
    <footer
      className="footer"
      data-global-footer
      data-nav-color="black"
      data-node-id="16017:417"
    >
      <div className="footer__signup">
        <p>Sign up to be the first to know about new arrivals</p>
        <span className="footer__signup-icon" aria-hidden>
          <img src={assets.arrow} alt="" width={24} height={24} />
        </span>
      </div>
      <div className="footer__rule footer__rule--signup" />

      <nav className="footer__nav" aria-label="Footer">
        {LINK_SECTIONS.map((label, index) => (
          <div
            key={label}
            className={
              index === 0 ? "footer__section" : "footer__section footer__section--spaced"
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

      <div className="footer__social">
        <ul>
          {SOCIAL_LEFT.map((label) => (
            <li key={label}>
              <a href="#">{label}</a>
            </li>
          ))}
        </ul>
        <ul>
          {SOCIAL_RIGHT.map((label) => (
            <li key={label}>
              <a href="#">{label}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer__rule footer__rule--after-social" />
      <p className="footer__brands-label">New Balance family of brands</p>
      <div className="footer__brands" role="group" aria-label="Family brands">
        <img src={assets.brandBrine} alt="Brine" width={74} height={23} />
        <img src={assets.brandWarrior} alt="Warrior" width={104} height={24} />
        <img
          src={assets.brandTeamSports}
          alt="NB Team Sports"
          width={111}
          height={22}
        />
      </div>
      <div className="footer__rule footer__rule--after-brands" />

      <div className="footer__logo">
        <img
          src={assets.logoFooter}
          alt="New Balance"
          width={76}
          height={37}
        />
      </div>

      <div className="footer__legal">
        {LEGAL_LINKS.map((label) => (
          <a key={label} href="#">
            {label}
          </a>
        ))}
      </div>
      <p className="footer__copy">Copyright New Balance 2026</p>
    </footer>
  );
}
