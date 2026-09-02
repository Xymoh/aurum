import type { CharacterData } from "../../types/character";
import { ELEMENT_COLORS } from "../../types/character";
import { GRADE_COLORS } from "../../types/artifact";
import { SetBonusRow } from "../ui/SetBonusRow";
import { BuildScoreBar } from "../ui/BuildScoreBar";
import { ArtifactCard } from "./ArtifactCard";
import { WarningIcon } from "../ui/icons";
import { useState } from "react";
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
        <img key={i} src={starIcon} alt="" className="w-2 h-2" />
      ))}
    </div>
  );
}

// ── Stat row for the collapsed summary ──
function StatRow({ statKey, value, icon }: { statKey: StatKey; value: number; icon?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-baseline gap-2 text-sm">
      {/* The label wraps rather than truncates: at this size "CRIT DMG" lost
          its last word to an ellipsis, which is worse than a second line. */}
      <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
        {icon && <img src={icon} alt="" className="w-4 h-4 flex-shrink-0 opacity-70 self-center" />}
        <span className="text-dark-muted text-sm leading-snug">{t("stats", statKey)}</span>
      </div>
      <span className="text-dark-text font-mono font-semibold text-sm sm:text-sm tabular-nums flex-shrink-0">
        {formatStatValue(statKey, value)}
      </span>
    </div>
  );
}

export function CharacterCard({ character, index, isExpanded, onToggleExpand }: CharacterCardProps) {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const elementColor = ELEMENT_COLORS[character.element] ?? "#6b7280";
  const gradeColor = GRADE_COLORS[character.buildScore.grade] ?? "#aaa";
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
      className="rounded-xl border border-dark-border bg-dark-card overflow-hidden animate-fade-in-up flex flex-col scroll-mt-4"
      // Staggered so the list assembles top-down rather than flashing in as a
      // block, capped because a 12-character showcase spent nearly a second
      // waiting on the last card at the previous 80ms per index.
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {/* ── BANNER HEADER ── */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="relative w-full min-h-[118px] sm:min-h-[135px] flex items-center text-left cursor-pointer overflow-hidden group border-b border-transparent hover:border-dark-border/30 transition-colors"
      >
        <div className="absolute inset-0 bg-dark-bg z-0" />

        {/* Banner image on the right */}
        <div className="absolute inset-0 z-0 flex justify-end">
          <div
            className="w-full sm:w-2/3 h-full relative"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 60%)",
              WebkitMaskImage: "-webkit-linear-gradient(left, transparent, black 60%)",
            }}
          >
            <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundColor: elementColor }} />
            {portraitUrl && !imgError && (
              <img
                src={portraitUrl}
                alt={character.name}
                className="w-full h-full object-cover object-[center_22%] opacity-80 group-hover:opacity-100 transition-opacity duration-300"
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
        <div className="absolute inset-0 w-full md:w-3/4 bg-gradient-to-r from-dark-card via-dark-card/95 to-transparent z-10" />

        {/* Header Content */}
        <div className="relative z-20 flex w-full items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 rounded-full hidden sm:block" style={{ backgroundColor: elementColor }} />
            <div className="flex flex-col drop-shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shadow-sm"
                  style={{ backgroundColor: `${elementColor}EE`, color: "#000" }}
                >
                  {character.element.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-dark-text tracking-wide truncate max-w-[180px] sm:max-w-none">
                  {character.name}
                </h3>
                {/* Grade badge inline */}
                <span
                  className="text-sm font-extrabold px-1.5 py-0.5 rounded bg-dark-bg border border-dark-border/80 shadow-sm hidden sm:inline"
                  style={{ color: gradeColor }}
                >
                  {character.buildScore.grade}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-dark-muted">
                <span className="px-1.5 py-0.5 rounded bg-dark-card border border-dark-border/60 text-dark-text/90">
                  {t("weapons", "level", { n: character.level })}
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${character.constellation > 0 ? "bg-accent/20 border-accent/30 text-accent" : "bg-dark-bg/80 border-dark-border/60 text-dark-muted"}`}>
                  C{character.constellation}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-dark-card border border-dark-border/60 text-dark-text/90 hidden sm:inline-block">
                  {t("weapons", character.weaponType as "Sword")}
                </span>
                {/* Score on mobile inline */}
                <span className="inline sm:hidden font-mono font-bold text-dark-text/90">
                  {character.buildScore.total.toFixed(1)}
                  <span className="text-dark-muted font-extrabold ml-0.5" style={{ color: gradeColor }}>{character.buildScore.grade}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right side: score on desktop + expand arrow */}
          <div className="flex items-center gap-3 drop-shadow-md">
            <div className="text-right hidden sm:flex flex-col items-end">
              <span className="text-xs uppercase font-bold tracking-wider text-dark-muted mb-0.5">{t("showcase", "buildScore")}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-dark-text">{character.buildScore.total.toFixed(1)}</span>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-dark-text group-hover:bg-dark-card-hover transition-colors backdrop-blur-md shrink-0">
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* ── COLLAPSED STATS SUMMARY (always visible) ── */}
      <div className="bg-dark-bg/20 border-b border-dark-border/40 px-4 sm:px-6 py-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
          {statEntries.map((stat) => (
            <StatRow key={stat.key} statKey={stat.key} value={stat.value} icon={STAT_ICONS[stat.key]} />
          ))}
        </div>
      </div>

      {/* ── EXPANDED BODY ── */}
      {isExpanded && (
        <div className="border-t border-dark-border/60 bg-dark-bg/30">
          <div className="p-3 sm:p-4 lg:p-5 flex flex-col gap-3 sm:gap-4">

            {/* Traveler notice - same avatarId across all 7 elements, so scoring can't be element-tuned */}
            {character.usesGenericWeights && (
              <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 py-2.5 px-4 text-sky-300/90 text-sm flex items-center gap-2 font-medium">
                <WarningIcon className="w-4 h-4 flex-shrink-0" />
                Traveler's element isn't identifiable from the showcase data, so this score uses one
                generic all-purpose weighting instead of one tuned to your current Vision.
              </div>
            )}

            {/* ── AVATAR PROFILE + WEAPON ROW ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Avatar profile card */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl border flex-shrink-0"
                style={{
                  borderColor: `${elementColor}44`,
                  background: `linear-gradient(135deg, ${elementColor}22 0%, ${elementColor}08 100%)`,
                }}
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-[3px] flex-shrink-0"
                  style={{ borderColor: `${elementColor}88`, background: `linear-gradient(rgb(144,105,72) 0%, rgb(191,133,81) 100%)` }}
                >
                  {avatarIconUrl ? (
                    <img src={avatarIconUrl} alt={character.name} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { if (fallbackUrl && e.currentTarget.src !== fallbackUrl) { e.currentTarget.src = fallbackUrl; } }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: elementColor }}>
                      {character.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-dark-text flex items-center gap-2">
                    {character.name}
                    <span className="text-sm font-extrabold px-1.5 py-0.5 rounded bg-dark-bg border border-dark-border/80" style={{ color: gradeColor }}>
                      {character.buildScore.grade}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-sm px-1.5 py-0.5 rounded bg-dark-card border border-dark-border/60 text-dark-text/80">{t("weapons", "level", { n: character.level })}</span>
                    <span className={`text-sm px-1.5 py-0.5 rounded border ${character.constellation > 0 ? "bg-accent/20 border-accent/30 text-accent" : "bg-dark-bg/80 border-dark-border/60 text-dark-muted"}`}>
                      C{character.constellation}
                    </span>
                    {character.friendshipLevel !== undefined && character.friendshipLevel > 0 && (
                      <span className="text-sm px-1.5 py-0.5 rounded bg-dark-card border border-dark-border/60 text-dark-text/80 flex items-center gap-1">
                        <img src={friendshipIcon} alt="" className="w-3 h-3 opacity-70" />
                        {character.friendshipLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Weapon card (reduced size) */}
              {character.weapon && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dark-border bg-dark-card min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg bg-dark-bg icon-dark-bg border border-dark-border/60 flex-shrink-0 relative overflow-hidden">
                    {weaponIconUrl ? (
                      <img src={weaponIconUrl} alt={character.weapon.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-dark-muted">W</div>
                    )}
                    <div className="absolute bottom-0.5 left-0 right-0 flex justify-center">
                      <RarityStars count={character.weapon.rarity} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm font-semibold text-dark-text truncate">{character.weapon.name}</span>
                      <span className="text-xs px-1 py-0.5 rounded bg-dark-bg/80 border border-dark-border/60 text-dark-muted">R{character.weapon.refinement}</span>
                      <span className="text-xs px-1 py-0.5 rounded bg-dark-bg/80 border border-dark-border/60 text-dark-muted">Lv.{character.weapon.level}</span>
                    </div>
                    <div className="flex gap-x-3 gap-y-0.5 mt-0.5 text-sm flex-wrap">
                      <span className="text-dark-muted">{character.weapon.mainStat.name} <span className="text-dark-text/90 font-mono">{character.weapon.mainStat.value}</span></span>
                      {character.weapon.substat.name !== "-" && (
                        <span className="text-dark-muted">{character.weapon.substat.name} <span className="text-dark-text/90 font-mono">{character.weapon.substat.value}</span></span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── CONSTELLATIONS + TALENTS ROW ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Constellations */}
              <div className="flex-1 rounded-xl border border-dark-border bg-dark-card p-3">
                <div className="text-sm uppercase font-semibold tracking-wider text-dark-muted mb-2">{t("showcase", "constellation")}</div>
                <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                  {Array.from({ length: 6 }, (_, i) => {
                    const unlocked = i < character.constellation;
                    const sNum = i < 2 ? i + 1 : i === 2 ? 0 : i === 3 ? 3 : i === 4 ? 0 : 4;
                    const uNum = i === 2 ? 1 : i === 4 ? 2 : 0;
                    const useU = i === 2 || i === 4;
                    const conFile = useU ? `UI_Talent_U_${character.talentIconSuffix}_0${uNum}` : `UI_Talent_S_${character.talentIconSuffix}_0${sNum}`;
                    const conIcon = `${ENKA_UI_BASE}/${conFile}.png`;
                    const fallbackIcon = useU ? `${ENKA_UI_BASE}/UI_Talent_S_${character.talentIconSuffix}_0${i + 1}.png` : `${ENKA_UI_BASE}/UI_Talent_U_${character.talentIconSuffix}_0${i + 1}.png`;
                    return (
                      <div key={i} className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 bg-dark-bg icon-dark-bg ${unlocked ? "border-accent/60" : "border-dark-border/50"}`} title={`C${i + 1}${unlocked ? "" : " (locked)"}`}>
                        <img src={conIcon} alt={`C${i + 1}`} className="w-full h-full object-cover" loading="lazy"
                          onError={(e) => { if (e.currentTarget.src !== fallbackIcon) e.currentTarget.src = fallbackIcon; }}
                          style={{ filter: unlocked ? "none" : "brightness(0.4) saturate(0.3)" }} />
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <img src={lockIcon} alt="" className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Talents */}
              <div className="flex-1 rounded-xl border border-dark-border bg-dark-card p-3">
                <div className="text-sm uppercase font-semibold tracking-wider text-dark-muted mb-2">{t("showcase", "talents")}</div>
                <div className="flex gap-2.5">
                  {[
                    { label: "NA", icon: "Skill_A_01.png" },
                    { label: "Skill", icon: `Skill_S_${character.talentIconSuffix}_01.png` },
                    { label: "Burst", icon: `Skill_E_${character.talentIconSuffix}_01.png` },
                  ].map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-dark-border/40 bg-dark-bg icon-dark-bg">
                        <img src={`${ENKA_UI_BASE}/${t.icon}`} alt={t.label} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <span className="text-sm font-mono font-semibold text-dark-text">
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
              <div className="text-sm uppercase font-semibold tracking-wider text-dark-muted mb-3">{t("showcase", "artifacts")}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 justify-items-center">
                {["FLOWER", "PLUME", "SANDS", "GOBLET", "CIRCLET"].map((slotStr) => {
                  const art = character.artifacts.find((a) => a.slot === slotStr);
                  if (!art) {
                    return (
                      <div key={slotStr} className="flex flex-col items-center justify-center rounded-lg p-4 gap-2 border border-dashed border-dark-border/40 opacity-40 min-w-[130px] flex-1" style={{ maxWidth: "200px" }}>
                        <div className="w-10 h-10 rounded-lg bg-dark-bg/50 border border-dark-border flex items-center justify-center text-dark-muted">
                          <span className="text-sm font-semibold uppercase">{slotStr.slice(0, 2)}</span>
                        </div>
                        <span className="text-xs text-dark-muted">{t("showcase", "empty")}</span>
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

            {/* ── STATS OVERVIEW TABLE ── */}
            <div className="rounded-xl border border-dark-border bg-dark-card/40 overflow-hidden">
              <div className="text-sm uppercase font-semibold tracking-wider text-dark-muted px-4 py-2.5 border-b border-dark-border">
                {t("showcase", "statsOverview")}
              </div>
              <div className="divide-y divide-dark-border/40">
                {statEntries.map((stat) => (
                  <div key={stat.key} className="flex items-center px-4 py-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {STAT_ICONS[stat.key] && <img src={STAT_ICONS[stat.key]} alt="" className="w-4 h-4 flex-shrink-0 opacity-70" />}
                      <span className="text-sm text-dark-muted">{t("stats", stat.key)}</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-dark-text tabular-nums">
                      {formatStatValue(stat.key, stat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incomplete notice */}
            {!hasAllArtifacts && character.artifacts.length > 0 && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 py-2.5 px-4 text-orange-400/90 text-sm flex items-center gap-2 font-medium">
                <WarningIcon className="w-4 h-4 flex-shrink-0" /> {t("showcase", "incompleteScore", { count: character.artifacts.length })}
              </div>
            )}

            {/* No artifacts */}
            {character.artifacts.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center text-dark-muted p-10 border border-dashed border-dark-border/60 rounded-xl bg-dark-card/50">
                <img src={artifactEmptyIcon} alt="" className="w-12 h-12 opacity-30 mb-4" />
                <p className="text-sm font-medium">{t("showcase", "noArtifacts")}</p>
              </div>
            )}

            {/* Build Score Bar */}
            <BuildScoreBar score={character.buildScore.total} grade={character.buildScore.grade} artifactCount={character.buildScore.artifactCount} correctMainStats={character.buildScore.correctMainStats} totalSelectableSlots={character.buildScore.totalSelectableSlots} />
          </div>
        </div>
      )}
    </div>
  );
}
