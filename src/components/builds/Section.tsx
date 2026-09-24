import type { ReactNode } from "react";
import type { BuildSkin } from "./skin";

/**
 * One titled panel of the build page. Sections that the nav can jump to
 * carry an id; the scroll margin keeps the title clear of the sticky site
 * header and the sticky section nav under it.
 */
export function Section({
  id,
  title,
  skin,
  children,
  note,
  aside,
}: {
  id?: string;
  title: string;
  skin: BuildSkin;
  children: ReactNode;
  note?: string;
  /** Right-aligned beside the title, e.g. a level picker. */
  aside?: ReactNode;
}) {
  return (
    <section id={id} className={`game-panel scroll-mt-28 border p-4 sm:p-5 ${skin.panel}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${skin.text}`}>{title}</h2>
        {aside}
      </div>
      {note && <p className={`mt-1 text-xs ${skin.muted}`}>{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A heading inside a section, for its sub-blocks (Skills / Passives, Ascension / Talents). */
export function SubHeading({ skin, children }: { skin: BuildSkin; children: ReactNode }) {
  return <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${skin.muted}`}>{children}</h3>;
}
