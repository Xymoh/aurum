import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ShowcasePage } from "./pages/ShowcasePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { I18nProvider } from "./i18n/I18nProvider";
import { GamePickerPage } from "./games/GamePickerPage";
import { HsrLayout } from "./hsr/pages/HsrLayout";
import { HsrHomePage } from "./hsr/pages/HsrHomePage";
import { HsrShowcasePage } from "./hsr/pages/HsrShowcasePage";

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

export function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <Routes>
            {/* Root is the game picker. Each game then owns its own layout,
                palette and routes beneath its prefix. */}
            <Route index element={<GamePickerPage />} />

            <Route path="genshin" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="showcase/:uid" element={<ShowcasePage />} />
            </Route>

            <Route path="hsr" element={<HsrLayout />}>
              <Route index element={<HsrHomePage />} />
              <Route path="showcase/:uid" element={<HsrShowcasePage />} />
            </Route>

            <Route path="showcase/:uid" element={<LegacyShowcaseRedirect />} />

            <Route element={<Layout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  );
}
