import { useEffect, useRef, useState, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import { retryUrls } from "../../lib/remoteImage";

/** Long enough for a dropped connection to come back, short enough that nobody waits on it. */
const RETRY_DELAY_MS = 1200;

type RemoteImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  /** The same picture under another name, for files whose naming varies. Tried at once. */
  alternates?: readonly string[];
  /** Different pictures that will do if this one cannot be had at all. Tried last. */
  fallbacks?: readonly string[];
};

/**
 * An <img> for art on a third-party CDN that does not give up on the first
 * failed fetch. After `alternates`, a failure waits a moment and asks again
 * (see retryUrls), then settles for `fallbacks`; the caller's onError runs
 * only once all of them have failed, so a card goes blank only when the art
 * is really gone.
 */
export function RemoteImg({ src, alternates, fallbacks, onError, ...rest }: RemoteImgProps) {
  const [attempt, setAttempt] = useState({ src, index: 0 });
  // A different picture starts from its own first URL.
  if (attempt.src !== src) setAttempt({ src, index: 0 });
  const index = attempt.src === src ? attempt.index : 0;

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const steps: { url: string; wait: boolean }[] = [];
  const add = (url: string, wait: boolean) => {
    if (!steps.some((s) => s.url === url)) steps.push({ url, wait });
  };
  add(src, false);
  for (const url of alternates ?? []) add(url, false);
  for (const url of retryUrls(src)) add(url, true);
  for (const url of fallbacks ?? []) add(url, false);

  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    const next = steps[index + 1];
    if (!next) {
      onError?.(e);
      return;
    }
    const advance = () => setAttempt((a) => (a.src === src && a.index === index ? { src, index: index + 1 } : a));
    window.clearTimeout(timer.current);
    if (next.wait) timer.current = window.setTimeout(advance, RETRY_DELAY_MS);
    else advance();
  };

  return <img {...rest} src={steps[index].url} onError={handleError} />;
}
