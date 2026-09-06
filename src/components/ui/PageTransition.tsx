import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Fades each route in as it arrives.
 *
 * Keyed on the path, so React remounts the subtree on navigation and the CSS
 * animation replays. That is the whole mechanism: no timers, and nothing that
 * has to be torn down if the user navigates again mid-animation.
 *
 * There is deliberately no matching exit animation. Playing one means holding
 * the old page on screen while the new one is already ready, which reads as
 * the app being slow rather than as polish. Fading in only costs nothing and
 * still smooths the swap.
 *
 * The animation moves opacity from 0, never a base style, so the global
 * reduced-motion rule that cancels animations outright leaves the page
 * visible rather than stranded at zero opacity.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
