/**
 * Scroll behaviour that honours the reader's motion preference. The CSS
 * reduced-motion rule cannot reach a scrollIntoView call, so every
 * programmatic scroll asks here instead of hard-coding "smooth".
 */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined" || !window.matchMedia) return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
