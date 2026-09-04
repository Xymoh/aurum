/**
 * English is the source of truth: every other locale is typed against this
 * object, so adding a key here turns every missing translation into a compile
 * error rather than a silently English string at runtime.
 *
 * `{name}` placeholders are substituted by the `t` helper. Keep them intact in
 * translations - order may change freely, the names may not.
 */
export const en = {
  nav: {
    howScoringWorks: "How scoring works",
    toggleTheme: "Toggle theme",
    language: "Language",
  },

  home: {
    tagline: "Score your artifacts like the pros",
    intro:
      "Enter a UID to instantly evaluate artifact quality across your entire showcase - per character, per piece.",
    recentLookups: "Recent lookups",
    howItWorks: "How it works",
    step1Title: "Enter a UID",
    step1Body:
      "Your showcase is read from Enka.Network - the characters you've put on display in-game. Nothing is stored, and no login is needed.",
    step2Title: "Every piece is scored",
    step2Body:
      "Each artifact's substats are weighted for the character actually wearing it, so a CRIT roll counts for a DPS and an EM roll counts for a driver.",
    step3Title: "You get a verdict",
    step3Body:
      "Each piece is labelled reroll, replace, or leave alone - with the real odds of a Dust of Enlightenment reshape paying off.",
    dataTitle: "Where the data comes from",
    dataShowcase: "Your showcase",
    dataShowcaseBody:
      ", which reads the characters you've set to display in-game. Only public showcase data is available, so a private profile or an empty showcase can't be scored.",
    dataStats: "Character stats",
    dataStatsBody: "'s open dataset.",
    dataStatsPrefix: " - auto-synced from ",
    dataWeights: "Substat weights",
    dataWeightsBody:
      " - hand-curated per character from community theorycrafting: KQM, Game8, Prydwen and Icy Veins. These are a judgement call, and where guides disagree we pick the mainstream build.",
    limitTitle: "This is a quick evaluation tool, not a definitive build guide.",
    limitBody:
      "A score judges how well an artifact rolled for one character in isolation - it doesn't model team buffs, reaction damage, energy requirements or rotation length. A piece this tool rates low can still be correct for your team.",
    limitFooter: "Use it to spot artifacts with room to improve - not as a final verdict. For precision optimization, consider tools like ",
  },

  uid: {
    placeholder: "Enter Genshin UID",
    lookUp: "Look Up",
    invalid: "UID must be exactly 9 digits.",
  },

  player: {
    share: "Share",
    refresh: "Refresh",
    ar: "AR {level}",
    wl: "WL {level}",
    chars: "{count} chars",
    justNow: "just now",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
  },

  showcase: {
    roomToImprove: "Room to Improve",
    roomToImproveSub: "Best next moves, cheapest first",
    jumpTo: "Jump to {name}",
    buildScore: "Build Score",
    artifacts: "Artifacts",
    setBonuses: "Set Bonuses",
    statsOverview: "Stats Overview",
    constellation: "Constellation",
    talents: "Talents",
    score: "Score",
    empty: "Empty",
    searchPlaceholder: "Search characters…",
    allElements: "All elements",
    shown: "{visible}/{total} shown",
    noMatch: "No characters match your filters.",
    expand: "Show details for {name}",
    collapse: "Hide details for {name}",
    methodologyHint: "Read the full methodology",
    copied: "Link copied",
    noCharacters: "No characters found on this showcase.",
    noCharactersHint: "The player may need to set up their character showcase in-game.",
    noArtifacts: "No artifacts equipped on this character.",
    incompleteScore: "Not scored: {count} of 5 artifact slots filled. The pieces below are still graded.",
    mainStats: "{correct}/{total} main stats",
    noSetBonus: "No set bonuses active",
    fullMatch: "Full Match",
    partialMatch: "Partial Match",
    pieces: "{count}pc",
    travelerNotice:
      "Traveler's element isn't identifiable from the showcase data, so this score uses one generic all-purpose weighting instead of one tuned to your current Vision.",
    sortScoreDesc: "Score (high → low)",
    sortScoreAsc: "Score (low → high)",
    sortLevelDesc: "Level (high → low)",
    sortNameAsc: "Name (A → Z)",
  },

  verdict: {
    rerollNow: "Reroll now",
    worthRerolling: "Worth rerolling",
    lowPriority: "Low priority",
    farmReplacement: "Farm a replacement",
    wellRolled: "Well rolled",
    levelTo20: "Level to +20 to reshape",
    erAtRisk: "ER at risk",
    perTry: " / try",
    dust: "{n} dust",
    blurbHigh: "Among the best value per dust on this account.",
    blurbMedium: "Decent value, but budget for several attempts.",
    blurbLow: "Dust goes further on other pieces first.",
    reasonReplaceNoValue:
      "None of these substats help this character - reshaping can't fix that.",
    reasonReplaceWeak:
      "Weak now, and even a lucky reshape tops out near {ceiling}% - farm a better piece instead.",
    reasonNone: "Its rolls already landed well - there's little left to gain.",
    reasonLevelUp: "Reshaping needs a +20 artifact - level it first.",
    tipCost:
      "Each reshape costs {dust} dust and has a {chance} chance of gaining 5%+ score.",
    tipTries: "{tries} tries ({dust} dust): {chance} likely",
    tipNominate: "Nominate: {stats}",
    tipMedianGain: "Typical gain when it hits: +{gain}%",
    tipCeiling: "Realistic good outcome: {ceiling}%",
    tipWellRolled:
      "Only a {chance} chance a reshape would gain 5%+ score, so dust is better spent elsewhere.",
    erNote:
      "{chance} of reshapes would leave you under the {threshold}% Energy Recharge this character is expected to need - and dropping a burst costs more than the crit rolls you'd gain. Nominate Energy Recharge as one of your two stats to protect it. That requirement is a rough guide and depends on your team, constellation and weapon, so check it against your own rotation.",
    mainStatWarning:
      "Main stat doesn't match recommended. Consider farming for the ideal main stat.",
  },

  explainer: {
    potentialTitle: "Potential %",
    potentialBody:
      "Each artifact's substats are weighted by how much they matter for the equipped character, then compared against that character's theoretical ideal roll. The result is a 0–200% scale: 100% is a solid, usable piece (roughly 4.5 max-value rolls), and 200% is a near-impossible, perfectly-rolled artifact. Main stats don't affect the score directly - Flower/Plume are fixed, and Sands/Goblet/Circlet main stat correctness is shown separately.",
    gradeTitle: "Grade Scale",
    rollsTitle: "Roll quality",
    rollsBody:
      "Every substat roll lands on one of four tiers: 70%, 80%, 90% or 100% of the stat's max roll, so a CRIT Rate upgrade can be worth 2.7% or 3.9%. Enka reports each roll's tier, so each substat shows one pip per roll, coloured from max (green) to low (rose). Hover or tap the pips for the exact value of every roll. The score uses the actual values, so two artifacts with the same rolls but different luck score differently.",
    mainStatTitle: "Main Stat & Set Bonus",
    mainStatBody:
      "A warning icon next to a main stat means it doesn't match the character's recommended stat for that slot. The Set Bonuses panel on each character card shows which 2-piece/4-piece bonuses are active and whether they match the recommended sets - both are informational and don't change the artifact's score.",
    rerollTitle: "Reroll Advice",
    rerollP1:
      "Since version 5.7, Dust of Enlightenment lets you reshape a +20 5★ artifact - redistributing its 5 upgrade rolls across the 4 substats it already has. It can't change which stats are on the piece. You nominate two substats and are guaranteed at least two upgrades across that pair. You can also reject a bad result and keep the original, so reshaping never makes a piece worse - the only thing it costs is dust.",
    rerollP2:
      "Because dust is scarce, the useful question isn't \"how good could this get in a perfect world\" - it's how likely is a reshape to actually improve this piece. We simulate 1,500 reshapes per artifact and count how many beat the current roll by a worthwhile margin. That share is the % / try shown on each badge - the exact odds of one reshape, not an average over imagined attempts.",
    rerollP3:
      "Cost is fixed per attempt: 1 dust for a Flower or Plume, 2 dust for a Sands, Goblet or Circlet. Priority weighs the odds against that cost, so a cheap slot earns a higher priority at lower odds:",
    dustAvg: "≤{n} dust avg.",
    tierReplaceNote: "substats too weak",
    tierWellRolledNote: "leave it alone",
    rerollP4:
      "Well rolled means the upgrades already landed on the stats that matter, so a reshape has little chance of beating what's there - often just a few percent. It isn't a gap in the analysis; it's the answer. Every +20 5★ piece gets one of these four verdicts.",
    rerollP5:
      "Those dust figures are long-run averages used only for ranking - you can't spend 9 dust on a Goblet, only 2 at a time. Hover any badge for the real numbers: your odds per reshape, what a given number of tries actually costs, and which two stats to nominate. A piece is only worth dust if its four substats can carry it somewhere good; if even a lucky reshape leaves it weak, it's flagged Farm a replacement instead.",
    erTitle: "The Energy Recharge caution",
    erP1:
      "Energy Recharge is the one substat where \"more is better\" breaks down. Past the point where your burst comes up on time it buys almost nothing - but drop under it and you lose a burst every rotation, costing far more than the crit rolls a reshape would trade it for. Every other stat is a smooth curve, so only ER gets this treatment: CRIT Rate goals are about balancing against CRIT DMG, and ATK or EM targets just describe what a good build looks like. None of them has a cliff.",
    erP2:
      "So when a piece's ER is doing real work, it's flagged ER at risk with its own odds - the share of reshapes that would leave you short. That sits next to the reroll odds rather than being folded into them, because an ER requirement is one rough number per character, while the real figure moves with your team, your constellation and your weapon: solo-Electro Flins wants far more than double-Electro Flins, and a signature weapon that restores energy on its passive can cut the requirement by 20-30% on its own. Letting an approximation silently veto advice would be worse than showing you both numbers and trusting you to weigh them.",
    erP3:
      "If you do reshape a flagged piece, nominate Energy Recharge as one of your two stats so the guarantee protects it.",
    disclaimer:
      "This is a quick evaluation tool, not a definitive build guide - scores reflect general substat priorities and may not fit every team comp or playstyle.",
  },

  errors: {
    title: "Error Loading Showcase",
    tryAgain: "Try Again",
    noUid: "No UID provided.",
    generic: "Failed to load showcase data.",
  },

  elements: {
    Pyro: "Pyro",
    Hydro: "Hydro",
    Anemo: "Anemo",
    Electro: "Electro",
    Dendro: "Dendro",
    Cryo: "Cryo",
    Geo: "Geo",
  },

  stats: {
    maxHp: "Max HP",
    atk: "ATK",
    def: "DEF",
    em: "El. Mastery",
    critRate: "CRIT Rate",
    critDmg: "CRIT DMG",
    er: "En. Recharge",
    elemDmg: "El. DMG",
  },

  /** Roll history behind a substat's pips. */
  rolls: {
    summary: "{n} rolls · average {avg}% of max",
    unknown: "{n} upgrades · roll quality not reported for this artifact",
    initial: "Initial",
    upgrade: "Upgrade",
    max: "max roll",
    high: "high roll",
    mid: "mid roll",
    low: "low roll",
  },

  /** Chip labels. Short enough that all eight fit on one line of a card. */
  statsShort: {
    maxHp: "HP",
    atk: "ATK",
    def: "DEF",
    em: "EM",
    critRate: "CR",
    critDmg: "CD",
    er: "ER",
    elemDmg: "DMG",
  },

  slots: {
    FLOWER: "Flower",
    PLUME: "Plume",
    SANDS: "Sands",
    GOBLET: "Goblet",
    CIRCLET: "Circlet",
  },

  weapons: {
    Sword: "Sword",
    Claymore: "Claymore",
    Polearm: "Polearm",
    Catalyst: "Catalyst",
    Bow: "Bow",
    /** Level badge, e.g. "Lv. 90". */
    level: "Lv. {n}",
  },
} as const;

/** Every locale must provide exactly these keys - enforced at compile time. */
export type Dictionary = {
  [S in keyof typeof en]: { [K in keyof (typeof en)[S]]: string };
};
