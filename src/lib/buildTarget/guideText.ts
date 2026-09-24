/**
 * GuideText, the flattened game text the build scripts write (see guide.ts),
 * split into runs a component can render without touching HTML.
 */

export interface TextRun {
  text: string;
  /** Inside "**": a span the game highlights. */
  strong: boolean;
}

/**
 * "Deals **120%** of ATK" -> plain, strong, plain. Each "**" toggles, so an
 * unpaired one (the scripts assert there are none, but a hand-edited file
 * might have one) only emphasises to the end of the text instead of
 * swallowing it.
 */
export function splitEmphasis(text: string): TextRun[] {
  const runs: TextRun[] = [];
  text.split("**").forEach((part, i) => {
    if (part) runs.push({ text: part, strong: i % 2 === 1 });
  });
  return runs;
}
