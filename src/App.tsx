import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { GamePickerPage } from "./games/GamePickerPage";
import { PRIVACY_PATH, TERMS_PATH } from "./legal/site";

// Each game is its own chunk. A visitor to the picker, or to one game,
// should not download the other two games' data tables: together they were
// most of a 1.3 MB bundle that every route paid for.
const Layout = lazy(() => import("./components/layout/Layout").then((m) => ({ default: m.Layout })));
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const ShowcasePage = lazy(() => import("./pages/ShowcasePage").then((m) => ({ default: m.ShowcasePage })));
const GenshinBuildsPage = lazy(() => import("./pages/GenshinBuildsPage").then((m) => ({ default: m.GenshinBuildsPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

const HsrLayout = lazy(() => import("./hsr/pages/HsrLayout").then((m) => ({ default: m.HsrLayout })));
const HsrHomePage = lazy(() => import("./hsr/pages/HsrHomePage").then((m) => ({ default: m.HsrHomePage })));
const HsrShowcasePage = lazy(() => import("./hsr/pages/HsrShowcasePage").then((m) => ({ default: m.HsrShowcasePage })));
const HsrBuildsPage = lazy(() => import("./hsr/pages/HsrBuildsPage").then((m) => ({ default: m.HsrBuildsPage })));

const ZzzLayout = lazy(() => import("./zzz/pages/ZzzLayout").then((m) => ({ default: m.ZzzLayout })));
const ZzzHomePage = lazy(() => import("./zzz/pages/ZzzHomePage").then((m) => ({ default: m.ZzzHomePage })));
const ZzzShowcasePage = lazy(() => import("./zzz/pages/ZzzShowcasePage").then((m) => ({ default: m.ZzzShowcasePage })));
const ZzzBuildsPage = lazy(() => import("./zzz/pages/ZzzBuildsPage").then((m) => ({ default: m.ZzzBuildsPage })));

const PrivacyPage = lazy(() => import("./legal/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./legal/TermsPage").then((m) => ({ default: m.TermsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Genshin showcases lived at /showcase/:uid before the site covered more than
 * one game, and those links are out in the world. Redirect rather than break
 * them.
 */
function LegacyShowcaseRedirect() {
  const { uid } = useParams();
  return <Navigate to={`/genshin/showcase/${uid}`} replace />;
}

/**
 * Shown for the few hundred milliseconds a game's chunk takes to arrive.
 * Deliberately empty of chrome: each game paints its own header, and a
 * generic one would flash and be replaced.
 */
function ChunkFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-dark-border border-t-dark-muted" />
    </div>
  );
}

export function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <Suspense fallback={<ChunkFallback />}>
            <Routes>
              {/* Root is the game picker. Each game then owns its own layout,
                  palette and routes beneath its prefix. */}
              <Route index element={<GamePickerPage />} />

              <Route path="genshin" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="showcase/:uid" element={<ShowcasePage />} />
                <Route path="builds" element={<GenshinBuildsPage />} />
                <Route path="builds/:id" element={<GenshinBuildsPage />} />
              </Route>

              <Route path="hsr" element={<HsrLayout />}>
                <Route index element={<HsrHomePage />} />
                <Route path="showcase/:uid" element={<HsrShowcasePage />} />
                <Route path="builds" element={<HsrBuildsPage />} />
                <Route path="builds/:id" element={<HsrBuildsPage />} />
              </Route>

              <Route path="zzz" element={<ZzzLayout />}>
                <Route index element={<ZzzHomePage />} />
                <Route path="showcase/:uid" element={<ZzzShowcasePage />} />
                <Route path="builds" element={<ZzzBuildsPage />} />
                <Route path="builds/:id" element={<ZzzBuildsPage />} />
              </Route>

              <Route path="showcase/:uid" element={<LegacyShowcaseRedirect />} />

              {/* Site-wide legal pages, outside any game's chrome. */}
              <Route path={PRIVACY_PATH} element={<PrivacyPage />} />
              <Route path={TERMS_PATH} element={<TermsPage />} />

              <Route element={<Layout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  );
}
