import { useEffect, useState } from "react";

/**
 * Seconds until a loaded showcase stops being fresh, ticking once a second
 * while there is anything to count down. Zero once Enka would have new data.
 */
export function useFreshCountdown(freshUntil: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (freshUntil <= Date.now()) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [freshUntil]);

  return Math.max(0, Math.ceil((freshUntil - now) / 1000));
}
