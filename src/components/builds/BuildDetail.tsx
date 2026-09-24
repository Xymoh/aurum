import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useUidQuery } from "../../hooks/useComparisonUid";
import { guideBehindKit, type GuideFile, type KitGroupId, type SetBonusFile } from "../../lib/buildTarget/guide";
import type { BuildListing, BuildTarget, SetPart } from "../../lib/buildTarget/model";
import type { ShareGame } from "../../lib/shareCard/model";
import { ChevronIcon, WarningIcon } from "../ui/icons";
import { RemoteImg } from "../ui/RemoteImg";
import { GuideTextView } from "./GuideTextView";
import { KitList } from "./KitList";
import { MaterialList } from "./MaterialList";
import { Section, SubHeading } from "./Section";
import { SectionNav, type NavItem } from "./SectionNav";
import { TeamList } from "./TeamList";
import { WeaponList } from "./WeaponList";
import type { BuildSkin } from "./skin";

/** The guide file as the page's query hands it over. */
export interface GuideState {
  guide: GuideFile | null;
  setBonuses: SetBonusFile;
  loading: boolean;
  failed: boolean;
}

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
  guide: GuideState;
  /** Every character with a build page, to name and picture team members. */
  roster: ReadonlyMap<string, BuildListing>;
  /** The weapon the visitor's own copy of this character wields, if known. */
  equippedWeaponId?: string | null;
}

/** Anchor ids, prefixed so they cannot collide with anything the layout adds. */
const SECTION = {
  build: "guide-build",
  weapons: "guide-weapons",
  teams: "guide-teams",
  kit: "guide-kit",
  constellations: "guide-constellations",
  materials: "guide-materials",
} as const;

const WEAPONS_TITLE = { genshin: "weaponsGenshin", hsr: "weaponsHsr", zzz: "weaponsZzz" } as const;
const BONUS_TITLE = { genshin: "bonusStatsGenshin", hsr: "bonusStatsHsr", zzz: "bonusStatsZzz" } as const;
const MAX_LEVEL: Record<ShareGame, number> = { genshin: 90, hsr: 80, zzz: 60 };

/** The six upgrades each game sells as duplicates, under their own names. */
const DUPLICATE_GROUPS: KitGroupId[] = ["constellations", "eidolons", "mindscapes"];

/** Where each game's skill text and materials come from, for the sources list. */
const GAME_DATA: Record<ShareGame, { label: string; url: string }> = {
  genshin: { label: "Project Amber", url: "https://gi.yatta.moe/" },
  hsr: { label: "StarRailRes", url: "https://github.com/Mar-7th/StarRailRes" },
  zzz: { label: "Dimbreath ZenlessData", url: "https://git.mero.moe/dimbreath/ZenlessData" },
};

function SourceLink({ source, skin }: { source: { label: string; url: string | null }; skin: BuildSkin }) {
  return source.url ? (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={`no-underline hover:underline ${skin.accent}`}>
      {source.label}
    </a>
  ) : (
    <span className={skin.text}>{source.label}</span>
  );
}

/** Stands in for a link inside a translated sentence until withLink swaps it in. */
const SLOT = "\u0000";

/**
 * A translated sentence with a link where the translation put the slot,
 * which is not at the same place in every language.
 */
function withLink(sentence: string, link: ReactNode): ReactNode {
  const [before, after = ""] = sentence.split(SLOT);
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

/**
 * "2026-09-23" as the reader's language writes a date. Read as UTC: the
 * string is a calendar day, and local midnight would slip it a day for
 * anyone west of Greenwich.
 */
function formatDay(day: string, lang: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** A label and a figure, as one chip. */
function StatChip({ label, value, skin }: { label: string; value: string; skin: BuildSkin }) {
  return (
    <span className={`game-panel-sm border px-2.5 py-1 text-sm ${skin.card} ${skin.text}`}>
      <span className={skin.muted}>{label}</span> <span className={`font-mono ${skin.accent}`}>{value}</span>
    </span>
  );
}

/**
 * Everything a character needs, on one page: the stat targets the scorer
 * grades against, and around them what a guide site would add - weapons,
 * teams, the kit, constellations and the materials to farm.
 *
 * The targets are read from the same metadata the scorer uses, so the page
 * and the verdict can never disagree. The rest comes from a guide file that
 * loads on its own; the targets render at once and the guide fills in under
 * them. Where no source lists something for a character, its section is
 * left out rather than shown empty.
 */
export function BuildDetail({ target, basePath, skin, owned, guide: state, roster, equippedWeaponId }: BuildDetailProps) {
  const { t, lang } = useI18n();
  const query = useUidQuery();
  const top = target.substats[0]?.weight ?? 1;
  const guide = state.guide;
  const game = target.game;

  const kitGroups = guide?.kit.filter((g) => !DUPLICATE_GROUPS.includes(g.id) && g.entries.length > 0) ?? [];
  const duplicates = guide?.kit.find((g) => DUPLICATE_GROUPS.includes(g.id) && g.entries.length > 0) ?? null;
  const hasTeams = Boolean(guide && (guide.teams.length > 0 || guide.synergies.some((id) => roster.has(id))));
  const hasPriorities = Boolean(guide?.skillPriority || guide?.tracePriority);

  const kitTitle = (id: KitGroupId): string => {
    switch (id) {
      case "skills":
        return t("guide", game === "genshin" ? "kitSkillsGenshin" : "kitSkills");
      case "passives":
        return t("guide", "kitPassives");
      case "traces":
        return t("guide", "kitTraces");
      case "core":
        return t("guide", "kitCore");
      default:
        return t("guide", id);
    }
  };

  const nav: NavItem[] = [{ id: SECTION.build, label: t("guide", "build") }];
  if (guide?.weapons.length) nav.push({ id: SECTION.weapons, label: t("guide", WEAPONS_TITLE[game]) });
  if (hasTeams) nav.push({ id: SECTION.teams, label: t("guide", "teams") });
  if (kitGroups.length > 0 || hasPriorities) nav.push({ id: SECTION.kit, label: t("guide", "kit") });
  if (duplicates) nav.push({ id: SECTION.constellations, label: kitTitle(duplicates.id) });
  if (guide?.materials.length) nav.push({ id: SECTION.materials, label: t("guide", "materials") });

  // ZZZ's substat weights are read from the guide's own line, so the line is
  // the source and the note says so; elsewhere it is a second opinion.
  const priorityLine = target.priority ?? guide?.substatLine ?? null;
  const priorityNote = target.priority ? t("builds", "priorityNote") : t("guide", "substatLineNote");

  // Genshin's ER target is read from the guide's own endgame line, so where
  // that line is shown the target is not repeated as a chip of its own.
  const energyInEndgame = Boolean(guide?.endgameStats.some((s) => /^energy recharge$/i.test(s.label)));
  const targets = [
    ...target.thresholds.map((th) => ({ label: th.label, value: String(th.target) })),
    ...(target.energyTarget !== null && !energyInEndgame ? [{ label: t("builds", "energy"), value: `${target.energyTarget}%` }] : []),
  ];

  /** The effects a part actually turns on: a 2-piece gets the 2-piece line only. */
  const effectsOf = (part: SetPart) =>
    (part.setId ? state.setBonuses[part.setId]?.bonuses ?? [] : []).filter((b) => b.pieces <= part.pieces);

  return (
    <div className="space-y-4">
      <Link to={`${basePath}${query}`} className={`inline-block text-sm no-underline ${skin.muted} hover:underline`}>
        ← {t("builds", "back")}
      </Link>

      <header className={`game-panel relative overflow-hidden border p-4 sm:p-5 ${skin.panel}`}>
        {target.portraitUrl && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2" aria-hidden="true">
            <RemoteImg
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
            <RemoteImg
              src={target.iconUrl}
              alt=""
              width={56}
              height={56}
              className={`h-12 w-12 shrink-0 rounded-full object-cover ring-1 ${skin.line}`}
            />
          )}
          <div className="min-w-0">
            <h1 className={`truncate text-xl font-bold sm:text-2xl ${skin.text}`}>{target.name}</h1>
            <p className={`mt-0.5 text-sm ${skin.muted}`}>{[...target.tags, ...(guide?.role ? [guide.role] : [])].join(" · ")}</p>
          </div>
        </div>
        <div
          className="relative mt-3 h-1 w-16 rounded-full"
          style={{ backgroundColor: target.accent }}
          aria-hidden="true"
        />
        {guide && guide.baseStats.length > 0 && (
          <div className="relative mt-3">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${skin.muted}`}>
              {t("guide", "baseStats", { level: MAX_LEVEL[game] })}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {guide.baseStats.map((stat, i) => (
                <span key={`${i}-${stat.label}`}>
                  <span className={skin.muted}>{stat.label}</span>{" "}
                  <span className={`font-mono tabular-nums ${skin.text}`}>{stat.value}</span>
                </span>
              ))}
              {guide.bonusStats.map((stat, i) => (
                <span key={`bonus-${i}-${stat.label}`} title={t("guide", BONUS_TITLE[game])}>
                  <span className={skin.muted}>{stat.label}</span>{" "}
                  <span className={`font-mono tabular-nums ${skin.accent}`}>+{stat.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {guide?.source && (
          <p className={`relative mt-3 text-xs ${skin.muted}`}>
            {withLink(
              guide.source.updated
                ? t("guide", "pickedFrom", { site: SLOT, date: formatDay(guide.source.updated, lang) })
                : t("guide", "pickedFromUndated", { site: SLOT }),
              <SourceLink source={guide.source} skin={skin} />,
            )}
          </p>
        )}
        {target.generic && (
          <p className={`relative mt-3 text-sm ${skin.muted}`}>{t("builds", "generic")}</p>
        )}
      </header>

      {guide?.kitChangedAt && guideBehindKit(guide) && (
        <p
          role="note"
          className="game-panel flex items-start gap-2 border border-warn/40 bg-warn/10 p-3 text-sm text-warn"
        >
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {guide.source?.updated
              ? t("guide", "behindKit", {
                  name: target.name,
                  changed: formatDay(guide.kitChangedAt, lang),
                  updated: formatDay(guide.source.updated, lang),
                })
              : t("guide", "behindKitUndated", { name: target.name, changed: formatDay(guide.kitChangedAt, lang) })}
          </span>
        </p>
      )}

      <SectionNav items={nav} skin={skin} />

      {owned}

      <Section id={SECTION.build} title={t("guide", "build")} skin={skin}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <SubHeading skin={skin}>{t("builds", "mainStats")}</SubHeading>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {target.slots.map((slot) => (
                <div key={slot.slot} className={`game-panel-sm border px-3 py-2 ${skin.card}`}>
                  <div className={`text-xs uppercase tracking-wide ${skin.muted}`}>{slot.slot}</div>
                  <div className={`mt-1 text-sm font-semibold ${skin.text}`}>
                    {slot.stats.length > 0 ? slot.stats.join(" / ") : t("builds", "anyStat")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SubHeading skin={skin}>{t("builds", "substats")}</SubHeading>
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
            <p className={`mt-2 text-xs ${skin.muted}`}>{t("builds", "substatsNote")}</p>
          </div>
        </div>

        {priorityLine && (
          <div className="mt-5">
            <SubHeading skin={skin}>{t("builds", "priority")}</SubHeading>
            <p className={`font-mono text-sm ${skin.text}`}>{priorityLine}</p>
            <p className={`mt-1 text-xs ${skin.muted}`}>{priorityNote}</p>
          </div>
        )}

        {targets.length > 0 && (
          <div className="mt-5">
            <SubHeading skin={skin}>{t("builds", "thresholds")}</SubHeading>
            <div className="flex flex-wrap gap-2">
              {targets.map((th, i) => (
                <StatChip key={`${i}-${th.label}`} label={th.label} value={th.value} skin={skin} />
              ))}
            </div>
            {target.energyTarget !== null && !energyInEndgame && (
              <p className={`mt-1 text-xs ${skin.muted}`}>{t("builds", "energyNote")}</p>
            )}
          </div>
        )}

        {guide && guide.endgameStats.length > 0 && (
          <div className="mt-5">
            <SubHeading skin={skin}>{t("guide", "endgameStats")}</SubHeading>
            <div className="flex flex-wrap gap-2">
              {guide.endgameStats.map((stat, i) => (
                <StatChip key={`${i}-${stat.label}`} label={stat.label} value={stat.value} skin={skin} />
              ))}
            </div>
            <p className={`mt-1 text-xs ${skin.muted}`}>{t("guide", "endgameStatsNote")}</p>
            {energyInEndgame && target.energyTarget !== null && (
              <p className={`mt-1 text-xs ${skin.muted}`}>{t("guide", "endgameEnergyNote", { target: target.energyTarget })}</p>
            )}
          </div>
        )}
      </Section>

      <Section
        title={t("builds", "sets")}
        skin={skin}
        note={target.sets.length === 0 ? t("builds", "setsUnknown") : undefined}
      >
        {target.sets.length > 0 ? (
          <ol className="space-y-3">
            {target.sets.map((rec, i) => {
              const effects = rec.parts.flatMap((part) => effectsOf(part).map((effect) => ({ part, effect })));
              return (
                <li key={i}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`w-4 shrink-0 font-mono text-xs ${skin.muted}`}>{i + 1}</span>
                    {rec.label && (
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${skin.card} ${skin.accent}`}>
                        {rec.label}
                      </span>
                    )}
                    {rec.parts.map((part, j) => (
                      <span
                        key={j}
                        className={`game-panel-sm inline-flex items-center gap-2 border py-1 pl-1 pr-2.5 text-sm ${skin.card} ${skin.text}`}
                      >
                        {part.iconUrl && (
                          <RemoteImg src={part.iconUrl} alt="" loading="lazy" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                        )}
                        {part.name}
                        <span className={`font-mono text-xs ${skin.accent}`}>{t("builds", "pc", { n: part.pieces })}</span>
                      </span>
                    ))}
                  </div>
                  {effects.length > 0 && (
                    <details className="group ml-6 mt-1.5" open={i === 0}>
                      <summary
                        className={`inline-flex cursor-pointer list-none items-center gap-1 text-xs font-semibold [&::-webkit-details-marker]:hidden ${skin.accent}`}
                      >
                        <ChevronIcon className="h-3.5 w-3.5 -rotate-90 transition-transform group-open:rotate-0" aria-hidden="true" />
                        {t("guide", "setEffects")}
                      </summary>
                      <dl className="mt-1.5 space-y-1.5">
                        {effects.map(({ part, effect }, k) => (
                          <div key={k}>
                            <dt className={`text-xs font-semibold ${skin.text}`}>
                              {part.name} · {t("guide", "setBonus", { n: effect.pieces })}
                            </dt>
                            <dd>
                              <GuideTextView text={effect.text} skin={skin} />
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        ) : null}
      </Section>

      {state.loading && (
        <section className={`game-panel border p-4 ${skin.panel}`} aria-busy="true">
          <p className={`text-sm ${skin.muted}`}>{t("guide", "loading")}</p>
        </section>
      )}
      {state.failed && (
        <section className={`game-panel border p-4 ${skin.panel}`} role="status">
          <p className={`text-sm ${skin.muted}`}>{t("guide", "failed")}</p>
        </section>
      )}
      {guide && !guide.source && (
        <section className={`game-panel border p-4 ${skin.panel}`}>
          <p className={`text-sm ${skin.muted}`}>{t("guide", "noPicks", { name: target.name })}</p>
        </section>
      )}

      {guide && guide.weapons.length > 0 && (
        <Section id={SECTION.weapons} title={t("guide", WEAPONS_TITLE[game])} skin={skin}>
          <WeaponList weapons={guide.weapons} game={game} skin={skin} name={target.name} equippedId={equippedWeaponId} />
        </Section>
      )}

      {guide && hasTeams && (
        <Section id={SECTION.teams} title={t("guide", "teams")} skin={skin} note={guide.teams.length > 0 ? t("guide", "teamsLead") : undefined}>
          <TeamList
            teams={guide.teams}
            synergies={guide.synergies}
            roster={roster}
            selfId={target.id}
            accent={target.accent}
            basePath={basePath}
            skin={skin}
          />
        </Section>
      )}

      {guide && (kitGroups.length > 0 || hasPriorities) && (
        <Section id={SECTION.kit} title={t("guide", "kit")} skin={skin}>
          {hasPriorities && (
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {guide.skillPriority && (
                <div className={`game-panel-sm border px-3 py-2 ${skin.card}`}>
                  <div className={`text-xs uppercase tracking-wide ${skin.muted}`}>{t("guide", "skillPriority")}</div>
                  <div className={`mt-1 text-sm font-semibold ${skin.text}`}>{guide.skillPriority}</div>
                </div>
              )}
              {guide.tracePriority && (
                <div className={`game-panel-sm border px-3 py-2 ${skin.card}`}>
                  <div className={`text-xs uppercase tracking-wide ${skin.muted}`}>{t("guide", "tracePriority")}</div>
                  <div className={`mt-1 text-sm font-semibold ${skin.text}`}>{guide.tracePriority}</div>
                </div>
              )}
            </div>
          )}
          <div className="space-y-5">
            {kitGroups.map((group) => (
              <div key={group.id}>
                <SubHeading skin={skin}>{kitTitle(group.id)}</SubHeading>
                <KitList entries={group.entries} skin={skin} accent={target.accent} columns={group.id === "skills" ? 1 : 2} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {duplicates && (
        <Section id={SECTION.constellations} title={kitTitle(duplicates.id)} skin={skin}>
          <KitList entries={duplicates.entries} skin={skin} accent={target.accent} columns={2} />
        </Section>
      )}

      {guide && guide.materials.length > 0 && (
        <Section id={SECTION.materials} title={t("guide", "materials")} skin={skin}>
          <MaterialList groups={guide.materials} game={game} skin={skin} />
        </Section>
      )}

      <footer className={`px-1 pb-2 text-xs ${skin.muted}`}>
        <h2 className="mb-1 font-semibold uppercase tracking-wide">{t("guide", "sources")}</h2>
        <dl className="grid grid-cols-1 gap-x-3 gap-y-0.5 sm:grid-cols-[auto_1fr]">
          <dt>{t("guide", "sourceWeights")}</dt>
          <dd>
            <SourceLink source={target.source} skin={skin} />
          </dd>
          {/* Game8 gives the sets and the rest of the picks on one page; one line credits both. */}
          {target.setsSource && target.setsSource.url !== guide?.source?.url && (
            <>
              <dt>{t("guide", "sourceSets")}</dt>
              <dd>
                <SourceLink source={target.setsSource} skin={skin} />
              </dd>
            </>
          )}
          {guide?.source && (
            <>
              <dt>{t("guide", target.setsSource && target.setsSource.url === guide.source.url ? "sourcePicksWithSets" : "sourcePicks")}</dt>
              <dd>
                <SourceLink source={guide.source} skin={skin} />
                {guide.source.updated && `, ${t("guide", "updatedOn", { date: formatDay(guide.source.updated, lang) })}`}
              </dd>
            </>
          )}
          {guide && (guide.kit.length > 0 || guide.materials.length > 0) && (
            <>
              <dt>{t("guide", "sourceGame")}</dt>
              <dd>
                {withLink(
                  t("guide", "sourceGameValue", { mirror: SLOT }),
                  <SourceLink source={GAME_DATA[game]} skin={skin} />,
                )}
              </dd>
            </>
          )}
        </dl>
      </footer>
    </div>
  );
}
