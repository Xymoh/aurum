import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found - Aurum");
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <h1 className="text-accent text-6xl font-bold">404</h1>
      <p className="text-dark-muted text-lg">This page doesn't exist.</p>
      <Link
        to="/"
        className="rounded-lg bg-accent px-6 py-2 text-dark-bg font-medium no-underline hover:opacity-90 transition-opacity"
      >
        Go Home
      </Link>
    </div>
  );
}
