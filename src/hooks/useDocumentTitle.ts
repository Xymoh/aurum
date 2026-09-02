import { useEffect } from "react";

/**
 * Sets the tab title while a layout is mounted, restoring the previous one on
 * the way out.
 *
 * The shell ships a single neutral title because the root is a game picker.
 * Without this every game's pages would announce themselves as "Aurum", and
 * someone with both scorers open could not tell the two tabs apart.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
