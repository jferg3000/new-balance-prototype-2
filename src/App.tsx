import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import PdpPage from "./pages/PdpPage";
import Plp9060Page from "./pages/Plp9060Page";
import StoneIslandPage from "./pages/StoneIslandPage";
import GlobalFootballPage from "./pages/GlobalFootballPage";

/**
 * Route architecture — shared layout owns global Promo Bar + Footer.
 * Quick Shop is not a route; it will live as an overlay on /9060-plp.
 * PDP is a reusable template at /pdp/:productId.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/9060-plp" element={<Plp9060Page />} />
          <Route path="/pdp/:productId" element={<PdpPage />} />
          <Route path="/stone-island" element={<StoneIslandPage />} />
          <Route path="/global-football" element={<GlobalFootballPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
