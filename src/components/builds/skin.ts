/**
 * Per-game palette classes for the shared build-target components.
 *
 * The three games have separate Tailwind colour scales (`hsr-text`,
 * `zzz-text`, `dark-text`), so a shared component cannot name its own
 * colours. Same approach ShowcaseHelp already takes: the component owns the
 * layout, the caller owns the surface.
 */
export interface BuildSkin {
  /** Outer panel: background and border. */
  panel: string;
  /** Inner card: background and border. */
  card: string;
  /** Card again, but interactive. */
  cardHover: string;
  text: string;
  muted: string;
  /** Accent as a text colour. */
  accent: string;
  /** Hairline dividers. */
  line: string;
  /** Search and select fields. */
  field: string;
}
