import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { SiteDataProvider } from "./context/SiteDataProvider";
import { SiteLayout } from "./layout/SiteLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { AdmissionsPage } from "./pages/AdmissionsPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ContactPage } from "./pages/ContactPage";
import { LandingPage } from "./pages/LandingPage";
import { DEFAULT_SCHOOL_SLUG } from "./lib/api";

/** The `:slug` route param is what actually picks a school now — resolved fresh on every visit, so this one deployment serves any published school with no rebuild needed when a new one is added. */
function SchoolSite() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return (
    <SiteDataProvider key={slug} slug={slug}>
      <SiteLayout />
    </SiteDataProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={DEFAULT_SCHOOL_SLUG ? <Navigate to={`/${DEFAULT_SCHOOL_SLUG}`} replace /> : <LandingPage />} />
        <Route path="/:slug" element={<SchoolSite />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
