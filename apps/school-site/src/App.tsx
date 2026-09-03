import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SiteDataProvider } from "./context/SiteDataProvider";
import { SiteLayout } from "./layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { AdmissionsPage } from "./pages/AdmissionsPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ContactPage } from "./pages/ContactPage";
import { SCHOOL_SLUG } from "./lib/api";

export function App() {
  // basename "/" (no slug) still works — the fetch itself will simply
  // fail with a clear "no VITE_SCHOOL_SLUG configured" message, rendered
  // by SiteLayout's error state, rather than a router-level crash.
  const basename = SCHOOL_SLUG ? `/${SCHOOL_SLUG}` : "/";

  return (
    <SiteDataProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SiteDataProvider>
  );
}
