interface ShowcaseHelpProps {
  /** Heading, e.g. "Nothing on display yet". */
  title: string;
  /** One or two sentences on why the page is empty. */
  lead: string;
  /** The in-game steps, in order. */
  steps: string[];
  /** Closing line, for the "I already did that" case. */
  footer: string;
  /** How many slots to draw in the diagram, and how many read as filled. */
  slots?: number;
  /** Palette classes, so each game keeps its own surface. */
  panelClass: string;
  accentClass: string;
  mutedClass: string;
  slotClass: string;
}

/**
 * What to do when a showcase comes back empty.
 *
 * A bare "no characters found" reads as a fault in the tool, when it is
 * almost always a profile that has nothing public on it. Enka answers the
 * same case with instructions, and it is the one moment where a first-time
 * visitor has nothing else to look at, so the page may as well teach the one
 * thing standing between them and a result.
 *
 * The row of empty slots at the top is decorative, but it names the thing the
 * steps are about: people who have never opened the showcase menu do not
 * necessarily know it exists.
 */
export function ShowcaseHelp({
  title,
  lead,
  steps,
  footer,
  slots = 8,
  panelClass,
  accentClass,
  mutedClass,
  slotClass,
}: ShowcaseHelpProps) {
  return (
    <div className={`game-panel border p-5 sm:p-6 ${panelClass}`}>
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: slots }, (_, i) => (
            <span
              key={i}
              className={`h-9 w-7 rounded border border-dashed sm:h-10 sm:w-8 ${slotClass}`}
            />
          ))}
        </div>

        <h2 className="mt-4 text-base font-semibold">{title}</h2>
        <p className={`mt-1.5 text-sm leading-relaxed ${mutedClass}`}>{lead}</p>

        <ol className="mt-5 w-full space-y-2.5 text-left">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${accentClass}`}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <p className={`mt-5 text-sm leading-relaxed ${mutedClass}`}>{footer}</p>
      </div>
    </div>
  );
}
