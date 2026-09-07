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
    noCharacters: "This showcase has no characters on display",
    noCharactersHint:
      "Artifact Aurum reads the characters you have made public in game, and nothing else. It never sees the rest of the account, so an empty showcase leaves it nothing to score.",
    showcaseStep1: "In game, open the Paimon menu and select your profile card at the top left.",
    showcaseStep2: "Choose Edit Profile, then Character Showcase, and add up to eight characters.",
    showcaseStep3:
      "Turn on Show Character Details. Without it the profile still loads, but every build comes back empty.",
    showcaseRetry:
      "Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again.",
    noArtifacts: "No artifacts equipped on this character.",
    incompleteScore: "Not scored: {count} of 5 artifact slots filled. The pieces below are still graded.",
    mainStats: "{correct}/{total} main stats",
    noSetBonus: "No set bonuses active",
    fullMatch: "Full Match",
    partialMatch: "Partial Match",
    pieces: "{count}pc",
    travelerNotice:
      "Read as the {element} Traveler. Ideal main stats follow that element's build; the substat weighting is one shared Traveler profile rather than one tuned per element.",
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

  // ── Honkai: Star Rail ────────────────────────────────────────────
  hsr: {
    title: "Relic Aurum",
    documentTitle: "Relic Aurum - Honkai: Star Rail relic scorer",
    tagline: "Where your rolls actually went",
    intro:
      "Grading relics one at a time hides the problem that matters. Six pieces can each look excellent while a quarter of your upgrades sit on stats the character never uses. This scores the whole build, not just the pieces.",
    uidPlaceholder: "Enter HSR UID",
    uidLabel: "Honkai Star Rail UID",
    analyse: "Analyse",
    uidInvalid: "UID must be exactly 9 digits.",
    step1Title: "Rolls are stated, not guessed",
    step1Body:
      "Star Rail reports how many upgrades landed on each substat and how good each one was. Nothing here is inferred from a displayed number.",
    step2Title: "Useful rolls are separated from dead ones",
    step2Body:
      "Every upgrade is weighted for the character wearing it. Rolls on stats that do nothing for their job are counted as waste, not quietly averaged away.",
    step3Title: "The build gets one honest number",
    step3Body:
      "Each relic is scored against the best relic its slot could hold for this character, the same way the Fribbels optimizer scores it. The build is the mean of its six pieces, with useful rolls counted against a {benchmark}-roll benchmark out of the {max} a build can physically hold.",
    gradedTitle: "How a relic is graded",
    gradedP1:
      "Every substat is converted to CRIT DMG units, so one max roll of anything is worth the same 6.48 before weighting: a CRIT Rate roll counts double, a SPD roll two and a half times. Each point is then weighted for the character, and the total is measured against the best relic the slot could hold: one max roll on each of the four best stats plus the five upgrades all on the best, with the main stat removed from the pool because it cannot also roll as a substat. That optimum is 200%; 100% is half of it, and the ladder climbs one band every 10 points: S at 100, SS at 120, SSS at 140, WTF at 160.",
    gradedP2:
      "A relic whose main stat the character has no use for keeps its percent but gets no letter. The number still tells you how the substats rolled; the missing grade tells you the piece is not a candidate. Flat ATK, HP and DEF rolls count for 40% of their percent stat.",
    gradedP3:
      "Rolls are shown as pips, one per roll, coloured by how good the roll was. A roll lands on one of three tiers, 80%, 90% or 100% of the max, but Enka reports a stat's roll count and combined quality rather than each roll on its own, so every pip on a stat carries that stat's average rather than its own tier. The colour is measured against the worst roll the game can give, so a stat that rolled all minimums reads as bad instead of merely average; hover or tap the pips for the numbers.",
    disagreeTitle: "Why a DPS score and a relic grade disagree",
    disagreeP1:
      "A relic grade asks whether one piece rolled well. A DPS benchmark asks what your whole stat vector produces. They can disagree completely, and when they do the grade is usually the one being naive: every piece rolling CRIT Rate is six good grades and one over-capped build.",
    disagreeP2:
      "This tool sits between them. It does not simulate damage, so it will never tell you a rotation number. It does tell you how many of your upgrades are working, which piece is carrying the dead weight, and whether your crit ratio and main stats are sane. That is arithmetic over stats we can read exactly, so it stays correct when new characters ship.",
    disagreeP3Prefix: "Substat weights and ideal main stats come per character from the ",
    disagreeP3Suffix:
      " tables, cross-checked against Prydwen's build guides, so a relic graded here matches the grade you would see there. A character released after the last refresh falls back to a Path profile until the table is re-imported, so nothing goes ungraded.",
    footerDisclaimer: "Relic Aurum is a fan-made tool and is not affiliated with HoYoverse.",
    footerDataPrefix: "Character data from ",
    footerDataMiddle: ", game tables from ",
    bestNextMoves: "Best next moves",
    bestNextMovesSub: "Across the whole showcase, best odds first",
    rollsUseful: "{effective}/{total} rolls useful",
    accountMeta: "{uid} · TL {level} · {count} characters",
    searchPlaceholder: "Search characters…",
    searchLabel: "Search characters",
    allPaths: "All paths",
    filterByPath: "Filter by path",
    sortCharacters: "Sort characters",
    noMatch: "No characters match your filters.",
    emptyTitle: "This showcase has no characters on display",
    emptyLead:
      "Relic Aurum reads the characters you have made public in game, and nothing else. It never sees the rest of the account, so an empty showcase leaves it nothing to score.",
    emptyStep1: "In game, open the phone menu and select your profile at the top left.",
    emptyStep2: "Edit the profile and fill the character showcase, up to eight characters.",
    emptyStep3: "Save it, then come back here and hit Refresh.",
    emptyRetry:
      "Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again.",
    traceBasic: "Basic",
    traceSkill: "Skill",
    traceUlt: "Ult",
    traceTalent: "Talent",
    traceBonus: "Traces",
    traceBonusTitle: "Bonus trace nodes taken",
    rolls: "{effective}/{total} rolls",
    usefulRolls: "Useful rolls",
    ofTotal: "of {total}",
    benchmarkTitle: "Benchmark: {n} useful rolls",
    atBenchmark: "At or above the {benchmark}-roll benchmark for a strong build.",
    pastBenchmark:
      "This build carries {total} upgrades, past the {benchmark}-roll benchmark, but {wasted} sit on stats this character never uses. That gap is what a per-piece grade cannot show.",
    shortOfBenchmark:
      "{wasted} upgrades sit on stats this character never uses, leaving it short of the {benchmark}-roll benchmark.",
    substatTotals: "Substat totals",
    critRatio: "Crit ratio",
    critRatioTarget: "target 1 : 2",
    deadRolls: "Where the dead rolls sit",
    nothingWasted: "Nothing wasted. Every upgrade is on a stat this character uses.",
    rollsCount: "{n} rolls",
    perDie: "% / die",
    farmReplacementShort: "farm a replacement",
    topsOut: "tops out {n}%",
    pieces: "{n}pc",
    notGraded: "Not graded: only 5-star relics with a usable score get a letter.",
    notGradedMain:
      "Not graded: this main stat does nothing for the character, so the piece is not a candidate however well its substats rolled.",
    whyNoGrade: "Why is there no grade?",
    notApplicable: "n/a",
    wrongMain: "wrong main",
    usefulSuffix: "/{total} useful",
    perDieSuffix: " / die",
    hopeFor: "Hope for {stats}",
    rollTipLabel: "{n} rolls, average {pct}% of max",
    rollTipHeading: "{n} rolls · average {pct}% of max",
    rollTipBody:
      "Best possible for {n} rolls: +{best}. A Star Rail roll lands on one of three tiers, 80%, 90% or 100% of the max, but Enka reports the combined quality of a stat's rolls rather than each roll on its own, so every pip here carries that average.",
    rollTipDead: "This stat does nothing for the character, so these rolls count as wasted.",
    rowHp: "HP",
    rowAtk: "ATK",
    rowDef: "DEF",
    rowSpd: "SPD",
    rowCritRate: "CRIT Rate",
    rowCritDmg: "CRIT DMG",
    rowBreak: "Break",
    rowEnergy: "Energy",
    rowEhr: "EHR",
    rowRes: "RES",
    rowDmg: "DMG",
  },

  hsrVerdict: {
    rerollNow: "Reroll now",
    worthRerolling: "Worth rerolling",
    lowPriority: "Low priority",
    farmReplacement: "Farm a replacement",
    wellRolled: "Well rolled",
    blurbHigh: "Among the best value per die on this account.",
    blurbMedium: "Decent odds, but budget for a few dice.",
    blurbLow: "Dice go further on other pieces first.",
    reasonWellRolled: "Its upgrades already sit on the right stats, so there is little left to gain.",
    reasonReplaceWeak:
      "Weak now, and even a lucky die tops out near {ceiling}%. Farm a better piece instead.",
  },

  hsrStats: {
    HPDelta: "HP",
    AttackDelta: "ATK",
    DefenceDelta: "DEF",
    HPAddedRatio: "HP%",
    AttackAddedRatio: "ATK%",
    DefenceAddedRatio: "DEF%",
    SpeedDelta: "SPD",
    CriticalChanceBase: "CRIT Rate",
    CriticalDamageBase: "CRIT DMG",
    StatusProbabilityBase: "Effect Hit Rate",
    StatusResistanceBase: "Effect RES",
    BreakDamageAddedRatioBase: "Break Effect",
    HealRatioBase: "Outgoing Healing",
    SPRatioBase: "Energy Regen",
    PhysicalAddedRatio: "Physical DMG",
    FireAddedRatio: "Fire DMG",
    IceAddedRatio: "Ice DMG",
    ThunderAddedRatio: "Lightning DMG",
    WindAddedRatio: "Wind DMG",
    QuantumAddedRatio: "Quantum DMG",
    ImaginaryAddedRatio: "Imaginary DMG",
  },

  hsrSlots: {
    HEAD: "Head",
    HAND: "Hands",
    BODY: "Body",
    FOOT: "Boots",
    NECK: "Sphere",
    OBJECT: "Rope",
  },

  hsrPaths: {
    Warrior: "Destruction",
    Rogue: "The Hunt",
    Mage: "Erudition",
    Memory: "Remembrance",
    Elation: "Elation",
    Shaman: "Harmony",
    Warlock: "Nihility",
    Knight: "Preservation",
    Priest: "Abundance",
  },

  // ── Zenless Zone Zero ────────────────────────────────────────────
  zzz: {
    title: "Disc Aurum",
    documentTitle: "Disc Aurum - Zenless Zone Zero drive disc scorer",
    kicker: "// Inter-Knot Report",
    headingA: "Disc",
    headingB: "Aurum",
    tagline: "Every roll, accounted for",
    intro:
      "A drive disc in Zenless has no lucky rolls: every upgrade is worth the same fixed amount. The only thing that varies is which stats the rolls landed on, so that is the only thing this scores.",
    uidPlaceholder: "Enter ZZZ UID",
    uidLabel: "Zenless Zone Zero UID",
    scan: "Scan",
    uidInvalid: "UID must be 9 or 10 digits.",
    step1Title: "Rolls are stated and fixed",
    step1Body:
      "Enka reports how many rolls each substat took. In Zenless every roll of a stat is worth the same, so a disc's value is exactly rolls times a known amount.",
    step2Title: "Useful rolls are separated from dead ones",
    step2Body:
      "Each roll is weighted for the agent wearing the disc, using Prydwen's per-agent priorities. Rolls on stats the agent does not use count as waste.",
    step3Title: "Six discs, one number",
    step3Body:
      "Each disc is scored against the best disc its slot could hold. The build is the mean of the six, with useful rolls counted against a {benchmark}-roll benchmark out of {max}.",
    gradedTitle: "How a disc is graded",
    gradedP1:
      "Every substat is converted to CRIT DMG units, so one roll of anything is worth the same 4.8 before weighting: a CRIT Rate roll counts double, a PEN roll a little over half. Each point is then weighted for the agent, and the total is measured against the best disc the slot could hold: one roll on each of the four best stats plus the five upgrades all on the best, with the main stat removed from the pool because it cannot also roll as a substat. That optimum is 200%; 100% is half of it, and the ladder climbs one band every 10 points, the same ladder as the other two games.",
    gradedP2:
      "A disc whose main stat the agent has no use for keeps its percent but gets no letter. Flat ATK, HP and DEF rolls count for 40% of their percent stat.",
    gradedP3: "One roll of each substat, as the game fixes them:",
    footerDisclaimer: "Disc Aurum is a fan-made tool and is not affiliated with HoYoverse.",
    footerDataPrefix: "Showcase data and game tables from ",
    footerDataMiddle: ", build priorities from ",
    replaceFirst: "Replace first",
    replaceFirstSub: "The discs holding a build back the most",
    accountMeta: "{uid} · IK {level} · {count} agents",
    rollsUseful: "{effective}/{total} rolls useful",
    searchPlaceholder: "Search agents…",
    searchLabel: "Search agents",
    allRoles: "All roles",
    filterByRole: "Filter by role",
    sortAgents: "Sort agents",
    noMatch: "No agents match your filters.",
    mainShort: "Main",
    mainSuffix: "{stat} main",
    emptyTitle: "This showcase has no agents on display",
    emptyLead:
      "Disc Aurum reads the agents you have made public in game, and nothing else. It never sees the rest of the account, so an empty showcase leaves it nothing to score.",
    emptyStep1: "In game, open the menu and select your Inter-Knot profile at the top left.",
    emptyStep2: "Edit the profile and add agents to the showcase.",
    emptyStep3: "Save it, then come back here and hit Refresh.",
    emptyRetry:
      "Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again.",
    skillBasic: "Basic",
    skillDodge: "Dodge",
    skillAssist: "Assist",
    skillSpecial: "Special",
    skillChain: "Chain",
    core: "Core",
    rolls: "{effective}/{total} rolls",
    usefulRolls: "Useful rolls",
    ofTotal: "of {total}",
    prydwenPriority: "Prydwen priority",
    substatTotals: "Substat totals",
    deadRolls: "Where the dead rolls sit",
    nothingWasted: "Nothing wasted. Every roll is on a stat this agent uses.",
    rollsCount: "{n} rolls",
    pieces: "{n}pc",
    rollTipLabel: "{n} rolls of {value}",
    rollTipHeading: "{n} × {value}",
    rollTipFixed:
      "Zenless fixes the size of every roll, so the pips only count how many landed here.",
    rollTipDead: "This stat does nothing for the agent, so these rolls count as wasted.",
    wrongMain: "wrong main",
    notGradedMain:
      "Not graded: this main stat does nothing for the agent, so the disc is not a candidate however well its substats rolled.",
    whyNoGrade: "Why is there no grade?",
    usefulSuffix: "/{total} useful",
    farmReplacement: "Farm a replacement",
    replaceReason:
      "Zenless has no reshape, so a disc that rolled onto the wrong stats can only be replaced.",
    benchmarkTitle: "Benchmark: {n} useful rolls",
    atBenchmark: "At or above the {benchmark}-roll benchmark for a strong build.",
    pastBenchmark:
      "This build carries {total} rolls, past the {benchmark}-roll benchmark, but {wasted} sit on stats this agent never uses.",
    shortOfBenchmark:
      "{wasted} rolls sit on stats this agent never uses, leaving it short of the {benchmark}-roll benchmark.",
    critRatio: "Crit ratio (substats)",
    critRatioTarget: "target 1 : 2",
    fromDiscs: "{stat} from discs",
    cap: "(cap {n}%)",
    rowHp: "HP",
    rowAtk: "ATK",
    rowDef: "DEF",
    rowImpact: "Impact",
    rowCritRate: "CRIT Rate",
    rowCritDmg: "CRIT DMG",
    rowAp: "AP",
    rowAm: "AM",
    rowPenRatio: "PEN Ratio",
    rowPen: "PEN",
    rowDmg: "DMG",
  },

  zzzStats: {
    "11101": "HP",
    "11102": "HP%",
    "11103": "HP",
    "12101": "ATK",
    "12102": "ATK%",
    "12103": "ATK",
    "12201": "Impact",
    "13101": "DEF",
    "13102": "DEF%",
    "13103": "DEF",
    "20103": "CRIT Rate",
    "21103": "CRIT DMG",
    "23103": "PEN Ratio",
    "23203": "PEN",
    "30502": "Energy Regen",
    "31203": "Anomaly Proficiency",
    "31402": "Anomaly Mastery",
    "31503": "Physical DMG",
    "31603": "Fire DMG",
    "31703": "Ice DMG",
    "31803": "Electric DMG",
    "31903": "Ether DMG",
    "32003": "Auric Ether DMG",
    "32303": "Wind DMG",
  },

  zzzSlots: {
    "1": "Disc 1",
    "2": "Disc 2",
    "3": "Disc 3",
    "4": "Disc 4",
    "5": "Disc 5",
    "6": "Disc 6",
  },

  zzzRoles: {
    Attack: "Attack",
    Stun: "Stun",
    Anomaly: "Anomaly",
    Support: "Support",
    Defense: "Defense",
    Rupture: "Rupture",
  },

  zzzElements: {
    Physics: "Physical",
    Fire: "Fire",
    Ice: "Ice",
    Elec: "Electric",
    Ether: "Ether",
    Wind: "Wind",
    AuricEther: "Auric Ether",
    FireFrost: "Frost",
    Lumen: "Lumen",
    ZhenZhenAssault: "Assault",
  },
} as const;

/** Every locale must provide exactly these keys - enforced at compile time. */
export type Dictionary = {
  [S in keyof typeof en]: { [K in keyof (typeof en)[S]]: string };
};
