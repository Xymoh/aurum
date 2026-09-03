import type { CharacterData } from "../../types/character";
import { ELEMENT_COLORS } from "../../types/character";
import type { ArtifactSlot } from "../../types/artifact";
import { SLOT_ORDER } from "../../lib/constants";
import { gradeVar } from "../../lib/grade";
import { formatScore } from "../../lib/format";
import { SetBonusRow } from "../ui/SetBonusRow";
import { BuildScoreBar } from "../ui/BuildScoreBar";
import { GradeBadge } from "../ui/GradeBadge";
import { ArtifactCard } from "./ArtifactCard";
import { WarningIcon } from "../ui/icons";
import { useEffect, useId, useState } from "react";
import { useI18n } from "../../i18n";

// ── Local SVG icon imports ──
import hpIcon from "../../assets/svg/types-hp.svg";
import atkIcon from "../../assets/svg/types-ATK.svg";
import defIcon from "../../assets/svg/types-DEF.svg";
import emIcon from "../../assets/svg/types-EM.svg";
import crIcon from "../../assets/svg/types-CR.svg";
import cdIcon from "../../assets/svg/types-CritDMG.svg";
import erIcon from "../../assets/svg/types-ER.svg";
import elemIcon from "../../assets/svg/types-Element.svg";
import friendshipIcon from "../../assets/svg/ico-friendship-level.svg";
import starIcon from "../../assets/svg/ico-star.svg";
import lockIcon from "../../assets/svg/ico-lock.svg";
import artifactEmptyIcon from "../../assets/svg/ico-artifact-empty.svg";

interface CharacterCardProps {
  character: CharacterData;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ENKA_UI_BASE = "https://enka.network/ui";
const TALENT_MAX = 15;

// ── Stat icon map from local SVGs ──
type StatKey = "maxHp" | "atk" | "def" | "em" | "critRate" | "critDmg" | "er" | "elemDmg";

const STAT_ICONS: Record<StatKey, string> = {
  maxHp: hpIcon,
  atk: atkIcon,
  def: defIcon,
  em: emIcon,
  critRate: crIcon,
  critDmg: cdIcon,
  er: erIcon,
  elemDmg: elemIcon,
};

/** Stats rendered as percentages rather than raw totals. */
const PCT_STATS = new Set<StatKey>(["critRate", "critDmg", "er", "elemDmg"]);

function formatStatValue(key: StatKey, value: number): string {
  if (PCT_STATS.has(key)) return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

function RarityStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <img key={i} src={starIcon} alt="" className="h-2 w-2" />
      ))}
    </div>
  );
}

/**
 * One stat as a chip: icon, short label, value. The short label is what
 * fits eight across; the full name is there for screen readers.
 */
function StatChip({ statKey, value }: { statKey: StatKey; value: number }) {
  const { t } = useI18n();
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <img src={STAT_ICONS[statKey]} alt="" className="h-3.5 w-3.5 flex-shrink-0 self-center opacity-70" />
      <span className="text-dark-muted">
        <span className="sr-only">{t("stats", statKey)}</span>
        <span aria-hidden="true">{t("statsShort", statKey)}</span>
      </span>
      <span className="font-mono font-semibold tabular-nums text-dark-text">{formatStatValue(statKey, value)}</span>
    </div>
  );
}

/**
 * One artifact slot, collapsed to what the list view needs: which slot, how
 * it scored, and whether its main stat is the recommended one.
 */
function SlotPill({ slot, character }: { slot: ArtifactSlot; character: CharacterData }) {
  const { t } = useI18n();
  const art = character.artifacts.find((a) => a.slot === slot);

  if (!art) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-dark-border/70 px-2 py-0.5 text-xs text-dark-muted/70">
        {t("slots", slot)}
        <span className="opacity-70">{t("showcase", "empty")}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-dark-border/70 bg-dark-bg/40 px-2 py-0.5 text-xs">
      <span className="text-dark-muted">{t("slots", slot)}</span>
      {art.mainStat.isCorrect === false && (
        <WarningIcon className="h-3 w-3 text-warn" aria-label={t("verdict", "mainStatWarning")} />
      )}
      <span className="font-mono font-semibold tabular-nums" style={{ color: gradeVar(art.score.grade) }}>
        {formatScore(art.score.potentialPercent)}
      </span>
      <GradeBadge grade={art.score.grade} size="xs" />
    </span>
  );
}

export function CharacterCard({ character, index, isExpanded, onToggleExpand }: CharacterCardProps) {
  // Sticky: once opened, the body stays mounted so collapsing can animate.
  const [everExpanded, setEverExpanded] = useState(isExpanded);
  useEffect(() => {
    if (isExpanded) setEverExpanded(true);
  }, [isExpanded]);

  const { t } = useI18n();
  const bodyId = useId();
  const [imgError, setImgError] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element] ?? "#6b7280";
  const gradeColor = gradeVar(character.buildScore.grade);
  const hasAllArtifacts = character.artifacts.length === 5;

  const portraitUrl = character.icon
    ? `${ENKA_UI_BASE}/${character.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
    : null;

  const fallbackUrl = character.icon ? `${ENKA_UI_BASE}/${character.icon}.png` : null;

  const avatarIconUrl = character.icon ? `${ENKA_UI_BASE}/${character.icon}.png` : null;

  // Weapon icon URL
  const weaponIconUrl = character.weapon?.icon
    ? `${ENKA_UI_BASE}/${character.weapon.icon}.png`
    : null;

  // Stat entries for collapsed view
  const statEntries: Array<{ key: StatKey; value: number }> = [
    { key: "maxHp", value: character.stats.maxHp },
    { key: "atk", value: character.stats.atk },
    { key: "def", value: character.stats.def },
    { key: "em", value: character.stats.elementalMastery },
    { key: "critRate", value: character.stats.critRate },
    { key: "critDmg", value: character.stats.critDmg },
    { key: "er", value: character.stats.energyRecharge },
    { key: "elemDmg", value: character.stats.elementalDmg },
  ];

  return (
    <div
      id={`character-${character.id}`}
      className="character-card game-panel animate-fade-in-up flex scroll-mt-20 flex-col transition-colors"
      // Staggered so the list assembles top-down rather than flashing in as a
      // block, capped because a 12-character showcase spent nearly a second
      // waiting on the last card at the previous 80ms per index.
      style={{
        animationDelay: `${Math.min(index, 8) * 45}ms`,
        borderColor: isExpanded ? `${elementColor}55` : undefined,
      }}
    >
      {/* ── BANNER HEADER ── */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
        aria-label={t("showcase", isExpanded ? "collapse" : "expand", { name: character.name })}
        className="group relative flex min-h-[112px] w-full cursor-pointer items-center overflow-hidden text-left sm:min-h-[128px]"
      >
        <div className="absolute inset-0 z-0 bg-dark-bg" />

        {/* Banner image on the right */}
        <div className="absolute inset-0 z-0 flex justify-end">
          <div
            className="relative h-full w-full sm:w-2/3"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 60%)",
              WebkitMaskImage: "-webkit-linear-gradient(left, transparent, black 60%)",
            }}
          >
            <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundColor: elementColor }} />
            {portraitUrl && !imgError && (
              <img
                src={portraitUrl}
                alt=""
                className="h-full w-full object-cover object-[center_22%] opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                loading="lazy"
                onError={(e) => {
                  if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  } else {
                    setImgError(true);
                  }
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-dark-bg/40 to-transparent" />
          </div>
        </div>

        {/* Left Gradient */}
        <div className="absolute inset-0 z-10 w-full bg-gradient-to-r from-dark-card via-dark-card/95 to-transparent md:w-3/4" />

        {/* Header Content */}
        <div className="relative z-20 flex w-full items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-1 rounded-full sm:block" style={{ backgroundColor: elementColor }} />
            <div className="flex flex-col drop-shadow-lg">
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-sm"
                  style={{ backgroundColor: `${elementColor}EE`, color: "#000" }}
                  aria-label={t("elements", character.element)}
                >
                  {character.element.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="max-w-[180px] truncate text-lg font-bold tracking-wide text-dark-text sm:max-w-none sm:text-xl">
                  {character.name}
                </h3>
                <GradeBadge grade={character.buildScore.grade} size="sm" className="hidden sm:inline-flex" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-dark-muted">
                <span className="rounded border border-dark-border/60 bg-dark-card px-1.5 py-0.5 text-dark-text/90">
                  {t("weapons", "level", { n: character.level })}
                </span>
                <span className={`rounded border px-1.5 py-0.5 ${character.constellation > 0 ? "border-accent/30 bg-accent/15 text-accent" : "border-dark-border/60 bg-dark-bg/80 text-dark-muted"}`}>
                  C{character.constellation}
                </span>
                <span className="hidden rounded border border-dark-border/60 bg-dark-card px-1.5 py-0.5 text-dark-text/90 sm:inline-block">
                  {t("weapons", character.weaponType as "Sword")}
                </span>
                {/* Score on mobile inline */}
                <span className="inline items-center gap-1 sm:hidden">
                  <span className="font-mono font-bold tabular-nums" style={{ color: gradeColor }}>
                    {formatScore(character.buildScore.total)}
                  </span>{" "}
                  <GradeBadge grade={character.buildScore.grade} size="xs" />
                </span>
              </div>
            </div>
          </div>

          {/* Right side: score on desktop + expand arrow */}
          <div className="flex items-center gap-3 drop-shadow-md">
            <div className="hidden flex-col items-end text-right sm:flex">
              <span className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-dark-muted">{t("showcase", "buildScore")}</span>
              <span className="font-mono text-2xl font-bold leading-none tabular-nums" style={{ color: gradeColor }}>
                {formatScore(character.buildScore.total)}
              </span>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dark-border bg-dark-card text-dark-text backdrop-blur-md transition-colors group-hover:bg-dark-card-hover">
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* ── COLLAPSED SUMMARY (always visible) ──
          The five slot grades first, because that is the question this tool
          answers; the character's totals second, one chip each. */}
      <div className="space-y-2 border-t border-dark-border/40 bg-dark-bg/20 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap gap-1.5">
          {SLOT_ORDER.map((slot) => (
            <SlotPill key={slot} slot={slot} character={character} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {statEntries.map((stat) => (
            <StatChip key={stat.key} statKey={stat.key} value={stat.value} />
          ))}
        </div>
      </div>

      {/* ── EXPANDED BODY ──
          Expand and collapse both animate, via a grid row running 0fr to 1fr,
          which transitions without needing the content height up front.

          The row wrapper stays mounted while collapsed so 0fr is a value the
          browser has actually rendered. Mounting it only on first expand meant
          it appeared already at 1fr, leaving the transition nothing to start
          from, so the first expand snapped open. The artifacts inside still
          mount on that first expand and then stay: mounting every character's
          artifacts up front would be a lot of DOM for a twelve-character
          showcase. */}
      <div
        id={bodyId}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {everExpanded && (
            <div className="border-t border-dark-border/60 bg-dark-bg/30">
              <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-5">
                {/* Traveler notice - same avatarId across all 7 elements, so scoring can't be element-tuned */}
                {character.usesGenericWeights && (
                  <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-dark-text">
                    <WarningIcon className="h-4 w-4 flex-shrink-0 text-sky-400" />
                    {t("showcase", "travelerNotice")}
                  </div>
                )}

                {/* Build Score meter leads, so the number above is explained before the pieces below. */}
                <BuildScoreBar
                  score={character.buildScore.total}
                  grade={character.buildScore.grade}
                  artifactCount={character.buildScore.artifactCount}
                  correctMainStats={character.buildScore.correctMainStats}
                  totalSelectableSlots={character.buildScore.totalSelectableSlots}
                />

                {/* ── AVATAR PROFILE + WEAPON ROW ── */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Avatar profile card */}
                  <div
                    className="flex flex-shrink-0 items-center gap-3 rounded-xl border p-3"
                    style={{
                      borderColor: `${elementColor}44`,
                      background: `linear-gradient(135deg, ${elementColor}22 0%, ${elementColor}08 100%)`,
                    }}
                  >
                    <div
                      className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-[3px] sm:h-16 sm:w-16"
                      style={{ borderColor: `${elementColor}88`, background: `linear-gradient(rgb(144,105,72) 0%, rgb(191,133,81) 100%)` }}
                    >
                      {avatarIconUrl ? (
                        <img src={avatarIconUrl} alt="" className="h-full w-full object-cover" loading="lazy"
                          onError={(e) => { if (fallbackUrl && e.currentTarget.src !== fallbackUrl) { e.currentTarget.src = fallbackUrl; } }} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold" style={{ color: elementColor }}>
                          {character.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-base font-bold text-dark-text sm:text-lg">
                        {character.name}
                        <GradeBadge grade={character.buildScore.grade} size="sm" />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded border border-dark-border/60 bg-dark-card px-1.5 py-0.5 text-sm text-dark-text/80">{t("weapons", "level", { n: character.level })}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-sm ${character.constellation > 0 ? "border-accent/30 bg-accent/15 text-accent" : "border-dark-border/60 bg-dark-bg/80 text-dark-muted"}`}>
                          C{character.constellation}
                        </span>
                        {character.friendshipLevel !== undefined && character.friendshipLevel > 0 && (
                          <span className="flex items-center gap-1 rounded border border-dark-border/60 bg-dark-card px-1.5 py-0.5 text-sm text-dark-text/80">
                            <img src={friendshipIcon} alt="" className="h-3 w-3 opacity-70" />
                            {character.friendshipLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weapon card (reduced size) */}
                  {character.weapon && (
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-dark-border bg-dark-card px-3 py-2.5">
                      <div className="icon-dark-bg relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-dark-border/60 bg-dark-bg sm:h-16 sm:w-16">
                        {weaponIconUrl ? (
                          <img src={weaponIconUrl} alt={character.weapon.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-dark-muted">W</div>
                        )}
                        <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
                          <RarityStars count={character.weapon.rarity} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate text-sm font-semibold text-dark-text">{character.weapon.name}</span>
                          <span className="rounded border border-dark-border/60 bg-dark-bg/80 px-1 py-0.5 text-xs text-dark-muted">R{character.weapon.refinement}</span>
                          <span className="rounded border border-dark-border/60 bg-dark-bg/80 px-1 py-0.5 text-xs text-dark-muted">Lv.{character.weapon.level}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                          <span className="text-dark-muted">{character.weapon.mainStat.name} <span className="font-mono text-dark-text/90">{character.weapon.mainStat.value}</span></span>
                          {character.weapon.substat.name !== "-" && (
                            <span className="text-dark-muted">{character.weapon.substat.name} <span className="font-mono text-dark-text/90">{character.weapon.substat.value}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── CONSTELLATIONS + TALENTS ROW ── */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Constellations */}
                  <div className="flex-1 rounded-xl border border-dark-border bg-dark-card p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-muted">{t("showcase", "constellation")}</div>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {Array.from({ length: 6 }, (_, i) => {
                        const unlocked = i < character.constellation;
                        const sNum = i < 2 ? i + 1 : i === 2 ? 0 : i === 3 ? 3 : i === 4 ? 0 : 4;
                        const uNum = i === 2 ? 1 : i === 4 ? 2 : 0;
                        const useU = i === 2 || i === 4;
                        const conFile = useU ? `UI_Talent_U_${character.talentIconSuffix}_0${uNum}` : `UI_Talent_S_${character.talentIconSuffix}_0${sNum}`;
                        const conIcon = `${ENKA_UI_BASE}/${conFile}.png`;
                        const fallbackIcon = useU ? `${ENKA_UI_BASE}/UI_Talent_S_${character.talentIconSuffix}_0${i + 1}.png` : `${ENKA_UI_BASE}/UI_Talent_U_${character.talentIconSuffix}_0${i + 1}.png`;
                        return (
                          <div key={i} className={`icon-dark-bg relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-dark-bg sm:h-14 sm:w-14 ${unlocked ? "border-accent/60" : "border-dark-border/50"}`} title={`C${i + 1}${unlocked ? "" : " (locked)"}`}>
                            <img src={conIcon} alt={`C${i + 1}`} className="h-full w-full object-cover" loading="lazy"
                              onError={(e) => { if (e.currentTarget.src !== fallbackIcon) e.currentTarget.src = fallbackIcon; }}
                              style={{ filter: unlocked ? "none" : "brightness(0.4) saturate(0.3)" }} />
                            {!unlocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <img src={lockIcon} alt="" className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Talents */}
                  <div className="flex-1 rounded-xl border border-dark-border bg-dark-card p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-muted">{t("showcase", "talents")}</div>
                    <div className="flex gap-2.5">
                      {[
                        { label: "NA", icon: "Skill_A_01.png" },
                        { label: "Skill", icon: `Skill_S_${character.talentIconSuffix}_01.png` },
                        { label: "Burst", icon: `Skill_E_${character.talentIconSuffix}_01.png` },
                      ].map((talent, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className="icon-dark-bg h-10 w-10 overflow-hidden rounded-full border-2 border-dark-border/40 bg-dark-bg sm:h-12 sm:w-12">
                            <img src={`${ENKA_UI_BASE}/${talent.icon}`} alt={talent.label} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                          <span className="font-mono text-sm font-semibold text-dark-text">
                            {character.talents[idx] && character.talents[idx] > 0
                              ? `${character.talents[idx]}/${TALENT_MAX}`
                              : "?"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── ARTIFACTS SECTION (Fribbels-style cards) ── */}
                <div className="rounded-xl border border-dark-border bg-dark-card/40 p-3 sm:p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-muted">{t("showcase", "artifacts")}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {SLOT_ORDER.map((slotStr) => {
                      const art = character.artifacts.find((a) => a.slot === slotStr);
                      if (!art) {
                        return (
                          <div key={slotStr} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-dark-border/60 p-4 text-dark-muted">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dark-border bg-dark-bg/50">
                              <span className="text-sm font-semibold uppercase">{slotStr.slice(0, 2)}</span>
                            </div>
                            <span className="text-xs">{t("slots", slotStr)} · {t("showcase", "empty")}</span>
                          </div>
                        );
                      }
                      return <ArtifactCard key={art.id} artifact={art} />;
                    })}
                  </div>
                </div>

                {/* ── SET BONUSES ── */}
                {character.artifacts.length > 0 && (
                  <SetBonusRow artifacts={character.artifacts} setBonus={character.buildScore.setBonus} />
                )}

                {/* Incomplete notice */}
                {!hasAllArtifacts && character.artifacts.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-warn/20 bg-warn/10 px-4 py-2.5 text-sm font-medium text-dark-text">
                    <WarningIcon className="h-4 w-4 flex-shrink-0 text-warn" /> {t("showcase", "incompleteScore", { count: character.artifacts.length })}
                  </div>
                )}

                {/* No artifacts */}
                {character.artifacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-border/60 bg-dark-card/50 p-10 text-center text-dark-muted">
                    <img src={artifactEmptyIcon} alt="" className="mb-4 h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">{t("showcase", "noArtifacts")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
