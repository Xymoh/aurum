import { useId, useState } from "react";
import { useI18n } from "../../i18n";
import type { KitEntry } from "../../lib/buildTarget/guide";
import { ChevronIcon } from "../ui/icons";
import { RemoteImg } from "../ui/RemoteImg";
import { GuideTextView } from "./GuideTextView";
import type { BuildSkin } from "./skin";

/**
 * The level a scaling table opens at: 10 where the table has it, which is
 * where most talents end up without constellations, otherwise its top.
 */
function defaultLevelIndex(levels: number[]): number {
  const ten = levels.indexOf(10);
  return ten >= 0 ? ten : levels.length - 1;
}

function ScalingTable({ scaling, skin }: { scaling: NonNullable<KitEntry["scaling"]>; skin: BuildSkin }) {
  const { t } = useI18n();
  const selectId = useId();
  const [index, setIndex] = useState(() => defaultLevelIndex(scaling.levels));

  return (
    <details className="group mt-2">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold [&::-webkit-details-marker]:hidden ${skin.accent}`}
      >
        <ChevronIcon className="h-3.5 w-3.5 -rotate-90 transition-transform group-open:rotate-0" aria-hidden="true" />
        {t("guide", "scaling")}
      </summary>
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor={selectId} className={`text-xs ${skin.muted}`}>
          {t("guide", "level")}
        </label>
        <select
          id={selectId}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className={`rounded-md px-2 py-1 text-xs focus:outline-none ${skin.field}`}
        >
          {scaling.levels.map((level, i) => (
            <option key={level} value={i}>
              {level}
            </option>
          ))}
        </select>
      </div>
      <table className="mt-2 w-full text-xs">
        <tbody>
          {scaling.rows.map((row, i) => (
            // Labels repeat within a table (a tap and a hold "CD"), so the index is part of the key.
            <tr key={`${i}-${row.label}`} className="border-t border-current/10">
              <th scope="row" className={`py-1 pr-3 text-left font-normal ${skin.muted}`}>
                {row.label}
              </th>
              <td className={`py-1 text-right font-mono tabular-nums ${skin.text}`}>{row.values[index] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/**
 * Zenless titles moves "Basic Attack: Turbo Volt", and `kind` already says
 * "Basic Attack". The prefix is dropped only when it repeats the kind: under
 * Dodge, "Dash Attack:" is information and stays.
 */
function displayName(entry: KitEntry): string {
  const prefix = `${entry.kind}: `;
  return entry.name.startsWith(prefix) ? entry.name.slice(prefix.length) : entry.name;
}

function KitCard({ entry, skin, accent }: { entry: KitEntry; skin: BuildSkin; accent: string }) {
  const { t } = useI18n();
  return (
    <article className={`game-panel-sm border p-3 ${skin.card}`}>
      <div className="flex items-start gap-3">
        {entry.iconUrl && (
          // The games draw these as white glyphs on nothing, so they get a
          // dark disc of their own in either theme.
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: `radial-gradient(circle, ${accent}55 0%, #16181d 75%)` }}
          >
            <RemoteImg src={entry.iconUrl} alt="" loading="lazy" width={40} height={40} className="h-full w-full object-contain" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${skin.muted}`}>
            {entry.kind}
            {entry.level ? ` · ${t("guide", "levelShort", { n: entry.level })}` : ""}
          </p>
          <h4 className={`text-sm font-semibold ${skin.text}`}>{displayName(entry)}</h4>
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {entry.tags.map((tag, i) => (
                <span key={`${i}-${tag}`} className={`rounded border px-1.5 py-0.5 text-[11px] ${skin.card} ${skin.muted}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <GuideTextView text={entry.text} skin={skin} className="mt-2" />
      {entry.scaling && entry.scaling.rows.length > 0 && <ScalingTable scaling={entry.scaling} skin={skin} />}
    </article>
  );
}

/**
 * A run of kit entries in the game's own order. Two columns from `lg` for
 * the short ones (constellations), one for skills, whose text runs long.
 */
export function KitList({
  entries,
  skin,
  accent,
  columns = 1,
}: {
  entries: KitEntry[];
  skin: BuildSkin;
  accent: string;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid grid-cols-1 gap-2 ${columns === 2 ? "lg:grid-cols-2" : ""}`}>
      {entries.map((entry, i) => (
        <KitCard key={`${entry.kind}-${i}`} entry={entry} skin={skin} accent={accent} />
      ))}
    </div>
  );
}
