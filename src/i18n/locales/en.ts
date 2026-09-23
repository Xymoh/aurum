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

  /** Footer links to the legal pages. The pages themselves are English only. */
  legal: {
    privacy: "Privacy",
    terms: "Terms",
    support: "Support on Ko-fi",
    supportHint: "The site is free. Donations cover the hosting.",
  },

  /**
   * The showcase guides at /<game>/help/showcase, and the places that point
   * at them: home pages, empty states, "not found" errors and the hidden-gear
   * banner. Per-game keys carry a gi/hsr/zzz prefix; the rest is shared.
   */
  help: {
    navLabel: "Showcase help",
    title: "Getting your characters to show up",
    cantSee: "Can't see your characters? Read the showcase guide",
    emptyLink: "Step-by-step guide with screenshots",
    errorLink: "Why can't my showcase be found?",
    stepsHeading: "Set up the showcase in game",
    checksHeading: "Still not seeing them?",
    placeholderTitle: "Screenshot coming soon",
    openFull: "Open the full-size screenshot",
    backToLookup: "Back to the UID lookup",
    bannerTitle: "Your characters loaded, but their gear is hidden",
    bannerLink: "Show me where",

    giIntro:
      "Artifact Aurum reads the Character Showcase on your public profile, and nothing else. Whatever you put on display there, with details switched on, is what gets scored. Here is how to set it up and what to check if it still comes back empty.",
    giStep1: "In game, open the Paimon menu, tap the pencil icon next to your name and choose Edit Profile.",
    giStep2: "Under Character Showcase, fill the slots with the characters you want scored.",
    giStep3:
      "Turn on Show Character Details. Without it the profile still loads, but every character arrives with no artifacts. Then give the game a minute or two and press Refresh here.",
    giCapture1: "The Paimon menu with the pencil icon and Edit Profile highlighted",
    giCapture2: "Edit Profile with the Character Showcase slots highlighted",
    giCapture3: "The Show Character Details toggle, switched on",
    giCheckGear:
      "Characters show up but have no artifacts: Show Character Details is off. Turn it on in the showcase settings and refresh.",
    giBannerBody: "In game, turn on Show Character Details in the Character Showcase settings, then refresh.",

    hsrIntro:
      "Relic Aurum reads the character showcase on your public Trailblazer profile, and nothing else. Whatever you put on display there, with details visible to others, is what gets scored. Here is how to set it up and what to check if it still comes back empty.",
    hsrStep1: "In game, open the phone menu, tap the menu next to your profile and choose Trailblazer Profile.",
    hsrStep2: "Open the Character Showcase tab and fill the Support Character and Starfaring Companions slots.",
    hsrStep3:
      "In Settings, Social, set Make public your Trailblazer Profile's Collection to Yes. Then give the game a minute or two and press Refresh here.",
    hsrCapture1: "The phone menu with Trailblazer Profile highlighted",
    hsrCapture2: "The Character Showcase with its Support Character and Starfaring Companions slots highlighted",
    hsrCapture3: "Settings, Social, with Make public your Trailblazer Profile's Collection set to Yes",
    hsrCheckGear:
      "Characters show up but have no relics: the profile collection is not public. In Settings, Social, set Make public your Trailblazer Profile's Collection to Yes and refresh.",
    hsrBannerBody: "In game, go to Settings, Social and set Make public your Trailblazer Profile's Collection to Yes, then refresh.",

    zzzIntro:
      "Disc Aurum reads the agent showcase on your public Inter-Knot profile, and nothing else. Whatever you put on display there, with details visible to others, is what gets scored. Here is how to set it up and what to check if it still comes back empty.",
    zzzStep1: "In game, open the menu and select your profile at the top left.",
    zzzStep2: "On your Personal Homepage, fill the showcase row with the agents you want scored.",
    zzzStep3:
      "Open Social Media Settings and turn on Make Info Public. Then give the game a minute or two and press Refresh here.",
    zzzCapture1: "The main menu with the profile at the top left highlighted",
    zzzCapture2: "The Personal Homepage with the agent showcase row highlighted",
    zzzCapture3: "Social Media Settings with Make Info Public switched on",
    zzzCheckGear:
      "Agents show up but have no drive discs: your info is not public. Turn on Make Info Public in Social Media Settings and refresh.",
    zzzBannerBody: "In game, turn on Make Info Public in Social Media Settings, then refresh.",

    checkWait:
      "Give it time. The game publishes profile changes with a delay of a few minutes, and Enka.Network keeps its last answer for a while on top of that. Refresh once the countdown on the button has run out, and try again a few minutes later if nothing changed.",
    checkSwapped:
      "Gear is captured as it is equipped while the character is on display. If you swapped pieces after adding the character, the update arrives on the same delay.",
    checkUid: "Double-check the UID. It is the number on your profile card in game, not your account or login id.",
    checkNew:
      "A character or item from the current patch can take Enka.Network a few days to support. Until then it may be missing while the rest of the showcase scores normally.",
    checkPrivacy:
      "Only what the game makes public is readable. Nothing else on the account is visible to Enka.Network or to this site, and taking a character off the showcase removes it here on the next refresh.",
    checkIssue: "None of that helped?",
    checkIssueLink: "Open an issue with your UID and we will take a look.",
  },

  home: {
    tagline: "Score your artifacts like the pros",
    intro:
      "Enter a UID to instantly evaluate artifact quality across your entire showcase - per character, per piece.",
    recentLookups: "Recent lookups",
    footerDisclaimer: "Artifact Aurum is a fan-made tool and is not affiliated with HoYoverse.",
    footerDataPrefix: "Character data from ",
    footerBuildsPrefix: "Build priorities from ",
    footerBuildsMiddle: ", set recommendations from ",
    howItWorks: "How it works",
    step1Title: "Enter a UID",
    step1Body:
      "Your showcase is read from Enka.Network - the characters you've put on display in-game. Nothing is stored on a server, and no login is needed.",
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
    invalid: "UID must be 9 digits, or 10 starting with 18.",
  },

  player: {
    share: "Copy link",
    refresh: "Refresh",
    accountScore: "Account",
    export: "Export GOOD",
    exportHint: "Download this showcase as a GOOD file for Genshin Optimizer and other tools that read it.",
    buildsScored: "{n} of {total} builds scored",
    ar: "AR {level}",
    wl: "WL {level}",
    chars: "{count} chars",
    justNow: "just now",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
    freshFor: "Enka refreshes this profile in {n}s",
    refreshing: "Refreshing…",
  },

  showcase: {
    roomToImprove: "Room to Improve",
    roomToImproveSub: "Best next moves, cheapest first",
    jumpTo: "Jump to {name}",
    buildScore: "Build Score",
    buildScoreHint:
      "The mean of the five artifact scores. Each artifact is scored 0 to 200: its substat rolls, weighted for this character, against the best rolls the slot could hold. 100 is a solid piece, 200 is perfect.",
    cv: "CV",
    percentileTop: "top {pct}%",
    percentileHint:
      "Scores higher than {pct}% of random +20 pieces for this slot and main stat, simulated from the game's substat odds and weighted for {name}. Context for the number, not a second grade.",
    newLabel: "new",
    newSince: "Not on display when this browser last looked, on {date}",
    deltaSince: "{delta} since this browser last looked, on {date}",
    cvHint: "Crit Value: 2 x CRIT Rate + CRIT DMG from the substats, plus a CRIT circlet's main stat. The number most players compare; the score beside it also counts the stats this character wants that are not crit.",
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
    showcaseStep1: "In game, open the Paimon menu and tap the pencil icon next to your name.",
    showcaseStep2: "Choose Edit Profile, then fill the Character Showcase with the characters you want scored.",
    showcaseStep3:
      "Turn on Show Character Details. Without it the profile still loads, but every build comes back empty.",
    showcaseRetry:
      "Already set it up? The game takes a moment to publish the change. Give it a minute and refresh again.",
    noArtifacts: "No artifacts equipped on this character.",
    incompleteScore: "Not scored: {count} of 5 artifact slots filled. The pieces below are still graded.",
    notScoredSlots: "Not scored: {filled} of {total} slots equipped",
    piecesOf: "{filled}/{total} pieces",
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
    mainStatWarningIdeal: "This slot wants {ideal}. {stat} is not on the list.",
    farmHint: "{slot} with {main} from {set}",
    farmHintNoSet: "{slot} with {main}",
    tipNextGrade: "{chance} chance to reach {grade} in one reshape",
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

  /** Genshin build diagnostics: the roll-level view under the score bar. */
  diag: {
    usefulRolls: "Useful rolls",
    ofTotal: "of {total}",
    benchmarkTitle: "Benchmark: {n} useful rolls",
    atBenchmark: "At or above the {benchmark}-roll benchmark for a strong build.",
    pastBenchmark:
      "This build carries {total} rolls, past the {benchmark}-roll benchmark, but {wasted} sit on stats this character never uses.",
    shortOfBenchmark: "{wasted} rolls sit on stats this character never uses, leaving it short of the {benchmark}-roll benchmark.",
    weakestLink: "The weakest piece is the {slot} at {score}.",
    substatTotals: "Substat totals",
    critRatio: "Crit ratio",
    critRatioTarget: "target 1 : 2",
    energyTarget: "Energy Recharge",
    energyOf: "of {target}% needed",
    deadRolls: "Where the dead rolls sit",
    nothingWasted: "Nothing wasted: every roll lands on a stat this character uses.",
    rollsCount: "{n} rolls",
  },

  errors: {
    title: "Error Loading Showcase",
    tryAgain: "Try Again",
    tryAnotherUid: "Try another UID",
    noUid: "No UID provided.",
    generic: "Failed to load showcase data.",
    notFound: "This UID could not be found. The player may not exist, or their showcase is not public.",
    maintenance: "Enka.Network is undergoing maintenance. Please try again later.",
    rateLimited: "Too many requests right now. Please wait a moment and try again.",
    unavailable: "Could not reach Enka.Network. Please try again in a moment.",
    timeout: "The request timed out. Check your connection and try again.",
    misconfigured: "This build has no showcase proxy configured, so lookups are unavailable.",
    invalidUid: "That is not a valid UID for this game.",
    refreshFailed: "Refresh failed. Showing the last showcase that loaded.",
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

  /** The downloadable character card. */
  /** Artifact stat types, in Genshin Optimizer's build vocabulary. */
  buildStats: {
    critRate: "CRIT Rate",
    critDmg: "CRIT DMG",
    atkPct: "ATK%",
    hpPct: "HP%",
    defPct: "DEF%",
    em: "Elemental Mastery",
    er: "Energy Recharge",
    healing: "Healing Bonus",
    physicalDmg: "Physical DMG",
    elementalDmg: "Elemental DMG",
    flatAtk: "Flat ATK",
    flatHp: "Flat HP",
    flatDef: "Flat DEF",
    elementDmg: "{element} DMG",
  },

  /** The build-target pages: what to aim for, before you own it. */
  builds: {
    title: "Build targets",
    lead: "What to aim for on every character, from the same data the scorer grades against.",
    documentTitle: "Build targets - Aurum",
    documentTitleCharacter: "{name} build - {game} - Aurum",
    navLabel: "Builds",
    search: "Search characters",
    filter: "Filter",
    allTags: "All",
    count: "{visible} of {total}",
    noMatch: "No characters match that.",
    back: "All characters",
    mainStats: "Target main stats",
    anyStat: "Any",
    substats: "Substat priority",
    substatsNote: "Relative value to this character. These are the weights the score itself uses.",
    sets: "Recommended sets",
    pc: "{n}pc",
    setsUnknown: "The data source does not list set recommendations for this character yet, so there is nothing to show here.",
    priority: "Guide priority",
    priorityNote: "The guide's own wording. The numbers above are our reading of it.",
    thresholds: "Stat targets",
    energy: "Energy Recharge target",
    energyNote: "What the rotation needs. Reroll advice stops recommending ER once you clear it.",
    generic: "No curated build for this character yet, so the scorer falls back to a generic profile for its role. Treat this as a starting point rather than a guide.",
    yours: "Your build",
    yoursNone: "Compare this against your own gear.",
    yoursLoading: "Checking your showcase...",
    yoursMissing: "{name} is not on display in UID {uid}. Add them to your in-game showcase to compare.",
    yoursUnavailable: "Could not load the showcase for UID {uid} just now.",
    yoursIncomplete: "Not every slot is filled yet.",
    viewInShowcase: "Open in showcase",
    lookUp: "Look up a UID",
    slotOk: "Matches the target",
    slotOff: "Not one of the target main stats",
  },

  shareCard: {
    share: "Share",
    hint: "Preview and share a card for this character",
    title: "Share card",
    close: "Close",
    preview: "Share card for {name}",
    rendering: "Rendering your card...",
    renderFailed: "The card could not be rendered.",
    retry: "Try again",
    actionX: "X",
    actionInstagram: "Instagram",
    actionDiscord: "Discord",
    actionSave: "Save image",
    actionCopyLink: "Copy link",
    actionMore: "More",
    /** The post text X is opened with. `{site}` is the game's wordmark. */
    postText: "{name} scored {score} ({grade}) on {site}",
    postTextPartial: "{name} on {site}",
    statusLinkCopied: "Link copied",
    statusImageCopiedPost: "Image copied - paste it into your post",
    statusImageCopiedDiscord: "Image copied - paste it into Discord",
    statusImageSaved: "Image saved",
    statusImageSavedPost: "Image saved - attach it to your post",
    statusImageSavedDiscord: "Image saved - drop it into Discord",
    statusImageSavedInstagram: "Image saved - upload it in the Instagram app",
    statusCopyFailed: "Could not copy the link",
    statusShareFailed: "Sharing was not available - image saved instead",
    pieces: "{filled}/{total} pieces",
    rolls: "{effective}/{total} effective rolls",
    mainStats: "{correct}/{total} ideal main stats",
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
    cv: "Crit Value",
  },

  /** Roll history behind a substat's pips. */
  rolls: {
    summary: "{n} rolls · average {avg}% of max",
    summaryOne: "1 roll · {avg}% of max",
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
    cv: "CV",
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
    footerBuildsPrefix: "Build priorities and sets from ",
    footerBuildsMiddle: " and ",
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
    emptyStep2: "Open Trailblazer Profile and fill the Character Showcase.",
    emptyStep3: "In Settings, Social, set Make public your Trailblazer Profile's Collection to Yes, then hit Refresh here.",
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
    uidInvalid: "UID must be 8 to 10 digits.",
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
    footerDataMiddle: ", build priorities and sets from ",
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
    emptyStep2: "On your Personal Homepage, add agents to the showcase row.",
    emptyStep3: "Turn on Make Info Public in Social Media Settings, then hit Refresh here.",
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
    statsPriority: "Stats priority",
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
    deadRollsBadge: "no useful rolls",
    notGradedDead:
      "Not graded: every substat on this disc does nothing for the agent, so there is nothing to measure.",
    levelUpFirst: "Level it to +{max} before judging it",
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
    critRatio: "Crit ratio",
    critRatioTarget: "target 1 : 2",
    fromDiscs: "{stat} total",
    cap: "(cap {n})",
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
    "12202": "Impact",
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
