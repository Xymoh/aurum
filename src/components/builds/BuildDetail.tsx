import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import type { BuildTarget } from "../../lib/buildTarget/model";
import type { BuildSkin } from "./skin";

interface BuildDetailProps {
  target: BuildTarget;
  /** Route the back link returns to, e.g. "/hsr/builds". */
  basePath: string;
  skin: BuildSkin;
  /**
   * The visitor's own version of this character, when a UID is known. Passed
   * in rather than fetched here: each game has its own showcase hook, and a
   * shared component cannot call three of them.
   */
  owned?: ReactNode;
}

function Section({
  title,
  skin,
  children,
  note,
}: {
  title: string;
  skin: BuildSkin;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section className={`game-panel border p-4 sm:p-5 ${skin.panel}`}>
      <h2 className={`text-sm font-semibold uppercase tracking-wide ${skin.text}`}>{title}</h2>
      {note && <p className={`mt-1 text-xs ${skin.muted}`}>{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * What to aim for on one character.
 *
 * Everything here is read from the same metadata the scorer grades against,
 * so the target and the verdict can never disagree. Where no source lists
 * something for a character, the page says so instead of leaving a panel
 * that looks broken.
 */
export function BuildDetail({ target, basePath, skin, owned }: BuildDetailProps) {
  const { t } = useI18n();
  const top = target.substats[0]?.weight ?? 1;

  return (
    <div className="space-y-4">
      <Link to={basePath} className={`inline-block text-sm no-underline ${skin.muted} hover:underline`}>
        ← {t("builds", "back")}
      </Link>

      <header className={`game-panel relative overflow-hidden border p-4 sm:p-5 ${skin.panel}`}>
        {target.portraitUrl && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2" aria-hidden="true">
            <img
              src={target.portraitUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover object-[center_18%] opacity-25"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 70%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 70%)",
              }}
            />
          </div>
        )}
        <div className="relative flex items-center gap-3">
          {target.iconUrl && (
            <img
              src={target.iconUrl}
              alt=""
              width={56}
              height={56}
              className={`h-12 w-12 shrink-0 rounded-full object-cover ring-1 ${skin.line}`}
            />
          )}
          <div className="min-w-0">
            <h1 className={`truncate text-xl font-bold sm:text-2xl ${skin.text}`}>{target.name}</h1>
            <p className={`mt-0.5 text-sm ${skin.muted}`}>{target.tags.join(" · ")}</p>
          </div>
        </div>
        <div
          className="relative mt-3 h-1 w-16 rounded-full"
          style={{ backgroundColor: target.accent }}
          aria-hidden="true"
        />
        {target.generic && (
          <p className={`relative mt-3 text-sm ${skin.muted}`}>{t("builds", "generic")}</p>
        )}
      </header>

      {owned}

      <Section title={t("builds", "mainStats")} skin={skin}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {target.slots.map((slot) => (
            <div key={slot.slot} className={`game-panel-sm border px-3 py-2 ${skin.card}`}>
              <div className={`text-xs uppercase tracking-wide ${skin.muted}`}>{slot.slot}</div>
              <div className={`mt-1 text-sm font-semibold ${skin.text}`}>
                {slot.stats.length > 0 ? slot.stats.join(" / ") : t("builds", "anyStat")}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("builds", "substats")} skin={skin} note={t("builds", "substatsNote")}>
        <ul className="space-y-1.5">
          {target.substats.map((stat) => (
            <li key={stat.label} className="flex items-center gap-3">
              <span className={`w-32 shrink-0 truncate text-sm ${skin.text}`}>{stat.label}</span>
              <span className={`h-2 flex-1 overflow-hidden rounded-full ${skin.card}`}>
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (stat.weight / top) * 100)}%`,
                    backgroundColor: target.accent,
                  }}
                />
              </span>
              <span className={`w-10 shrink-0 text-right font-mono text-xs ${skin.muted}`}>
                {stat.weight.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {target.priority && (
        <Section title={t("builds", "priority")} skin={skin} note={t("builds", "priorityNote")}>
          <p className={`font-mono text-sm ${skin.text}`}>{target.priority}</p>
        </Section>
      )}

      {target.thresholds.length > 0 && (
        <Section title={t("builds", "thresholds")} skin={skin}>
          <div className="flex flex-wrap gap-2">
            {target.thresholds.map((th) => (
              <span key={th.label} className={`game-panel-sm border px-2.5 py-1 text-sm ${skin.card} ${skin.text}`}>
                {th.label} <span className={skin.accent}>{th.target}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {target.energyTarget !== null && (
        <Section title={t("builds", "energy")} skin={skin} note={t("builds", "energyNote")}>
          <p className={`font-mono text-lg font-bold ${skin.accent}`}>{target.energyTarget}%</p>
        </Section>
      )}

      <Section
        title={t("builds", "sets")}
        skin={skin}
        note={target.sets.length === 0 ? t("builds", "setsUnknown") : undefined}
      >
        {target.sets.length > 0 ? (
          <ol className="space-y-2">
            {target.sets.map((rec, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className={`w-4 shrink-0 font-mono text-xs ${skin.muted}`}>{i + 1}</span>
                {rec.parts.map((part, j) => (
                  <span
                    key={j}
                    className={`game-panel-sm inline-flex items-center gap-2 border py-1 pl-1 pr-2.5 text-sm ${skin.card} ${skin.text}`}
                  >
                    {part.iconUrl && (
                      <img src={part.iconUrl} alt="" loading="lazy" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                    )}
                    {part.name}
                    <span className={`font-mono text-xs ${skin.accent}`}>{t("builds", "pc", { n: part.pieces })}</span>
                  </span>
                ))}
              </li>
            ))}
          </ol>
        ) : null}
      </Section>

      <p className={`text-xs ${skin.muted}`}>
        {t("builds", "source")}:{" "}
        {target.source.url ? (
          <a href={target.source.url} target="_blank" rel="noreferrer" className={skin.accent}>
            {target.source.label}
          </a>
        ) : (
          target.source.label
        )}
        {target.setsSource && (
          <>
            {" · "}
            {t("builds", "setsSource")}:{" "}
            {target.setsSource.url ? (
              <a href={target.setsSource.url} target="_blank" rel="noreferrer" className={skin.accent}>
                {target.setsSource.label}
              </a>
            ) : (
              target.setsSource.label
            )}
          </>
        )}
      </p>
    </div>
  );
}
