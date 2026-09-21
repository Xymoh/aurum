import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has come within `margin` of the viewport, and stays
 * true. Native `loading="lazy"` fires a screen or two ahead, which on a
 * stack of short cards means every card's banner downloads at once; this
 * waits until a card is close to being seen.
 */
export function useNearViewport<T extends Element>(ref: RefObject<T | null>, margin = "240px"): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin, near]);

  return near;
}
