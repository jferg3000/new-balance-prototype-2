import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { PromoBar } from "../components/PromoBar";
import { useNonHomepageDocumentScroll } from "../hooks/useNonHomepageDocumentScroll";
import { ScrollHeaderProvider } from "../hooks/useScrollAwareHeader";

/**
 * Shared chrome for every route:
 * Promo Bar → (page owns Main Nav + content) → Footer
 *
 * Two navigation modes (isolated — do not mix):
 * - `/` Homepage: stacked cards scroll inside `.page` so iOS Safari URL bar +
 *   toolbar stay exposed for the session (no root-document scroll).
 * - Commerce routes (PLP / Collection / PDP): native document scroll (Safari
 *   chrome may collapse). Leave-`/` cleanup: `useNonHomepageDocumentScroll`.
 *
 * Homepage owns the Footer in document flow below its stacked cards.
 * All other routes use the document-flow Footer after <Outlet />.
 *
 * Scroll-hide header behavior is enabled on all routes except Homepage.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const isHomepage = pathname === "/";
  const scrollHeaderEnabled = !isHomepage;

  useNonHomepageDocumentScroll(isHomepage, pathname);

  return (
    <ScrollHeaderProvider enabled={scrollHeaderEnabled} routeKey={pathname}>
      <PromoBar />
      <Outlet />
      {!isHomepage ? <Footer /> : null}
    </ScrollHeaderProvider>
  );
}
