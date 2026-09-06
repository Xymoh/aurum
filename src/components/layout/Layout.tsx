import { Outlet } from "react-router-dom";
import { PageTransition } from "../ui/PageTransition";
import { GameRail } from "../../games/GameRail";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  useDocumentTitle("Artifact Aurum - Genshin Impact artifact scorer");

  return (
    <div className="flex min-h-screen flex-col lg:pl-14" data-game="genshin">
      <GameRail current="genshin" />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
