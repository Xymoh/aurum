import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ShowcasePage } from "./pages/ShowcasePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { I18nProvider } from "./i18n/I18nProvider";
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

export function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <Routes>
            {/* Star Rail runs on its own layout: separate chrome, separate
                palette, nothing shared but the router and the query client. */}
            <Route path="hsr" element={<HsrLayout />}>
              <Route index element={<HsrHomePage />} />
              <Route path="showcase/:uid" element={<HsrShowcasePage />} />
            </Route>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="showcase/:uid" element={<ShowcasePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  );
}
