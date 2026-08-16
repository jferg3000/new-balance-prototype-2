import "./Footer.css";

const assets = {
  logoFooter: "/assets/logo-footer.svg",
  brandBrine: "/assets/brand-brine.svg",
  brandWarrior: "/assets/brand-warrior.svg",
  brandTeamSports: "/assets/brand-team-sports.svg",
  arrow: "/assets/icon-arrow.svg",
};

/**
 * Global Footer — source of truth from Figma 141:1339.
 * AppLayout: document-flow after page content on non-Homepage routes.
 * Homepage: document-flow below the stacked cards inside HomePage.
 */
export function Footer() {
  return (
    <footer
      className="footer"
      data-global-footer
      data-nav-color="black"
      data-node-id="141:1339"
    >
      <div className="footer__signup">
        <p>Sign up to be the first to know about new arrivals</p>
        <button type="button" aria-label="Sign up">
          <img src={assets.arrow} alt="" width={24} height={24} />
        </button>
      </div>
      <div className="footer__rule footer__rule--signup" />

      <nav className="footer__nav" aria-label="Footer">
        <button type="button" className="footer__row footer__row--first">
          Help
        </button>
        <div className="footer__rule" />
        <button type="button" className="footer__row">
          Shop
        </button>
        <div className="footer__rule" />
        <button type="button" className="footer__row">
          About us
        </button>
        <div className="footer__rule" />
        <button type="button" className="footer__row">
          For you
        </button>
        <div className="footer__rule" />
      </nav>

      <div className="footer__social">
        <div>
          <a href="#instagram">Instagram</a>
          <a href="#facebook">Facebook</a>
          <a href="#x">X</a>
        </div>
        <div>
          <a href="#youtube">YouTube</a>
          <a href="#pinterest">Pinterest</a>
          <a href="#tiktok">TikTok</a>
        </div>
      </div>

      <div className="footer__rule footer__rule--after-social" />
      <p className="footer__brands-label">New Balance family of brands</p>
      <div className="footer__brands" role="group" aria-label="Family brands">
        <img src={assets.brandBrine} alt="Brine" />
        <img src={assets.brandWarrior} alt="Warrior" />
        <img src={assets.brandTeamSports} alt="NB Team Sports" />
      </div>
      <div className="footer__rule footer__rule--after-brands" />

      <img
        className="footer__logo"
        src={assets.logoFooter}
        alt="New Balance"
        width={76}
        height={37}
      />

      <div className="footer__legal">
        <p>Privacy Policy</p>
        <p>Responsible Disclosure</p>
        <p>Website Terms &amp; Conditions</p>
        <p>CA Supply Chains Act (SB 657) and Modern Slavery Act Statement</p>
        <p>Health Data Privacy Policy</p>
        <p>Do Not Sell or Share My Personal Information</p>
      </div>
      <p className="footer__copy">Copyright New Balance 2026</p>
    </footer>
  );
}
