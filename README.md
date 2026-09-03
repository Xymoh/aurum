# Aurum

Gear scoring for gacha games. Enter a UID and find out which pieces are worth
investing in, which are dead weight, and what a reroll is actually likely to buy
you.

Two scorers live under one roof, each with its own layout and palette:

| | | |
|---|---|---|
| **Artifact Aurum** | Genshin Impact | `/genshin` |
| **Relic Aurum** | Honkai: Star Rail | `/hsr` |

**Live:** https://xymoh.github.io/aurum/

## Features

- **UID Lookup** - Enter any Genshin Impact UID to fetch the player's showcase via Enka.Network
- **Fribbels-Style Scoring** - Artifact scoring adapted from the [Fribbels HSR Optimizer](https://fribbels.github.io/hsr-optimizer) methodology
- **Potential Percent (0–200%)** - Each artifact scored as a percentage of its realistic potential, where 100% = solid artifact, 200% = theoretically perfect
- **18-Grade Scale** - F through WTF+ in 5% intervals with color-coded badges
- **Character-Specific Weights** - Scoring tailored per character (e.g., DEF% valued for Albedo, HP% for Hu Tao)
- **Main Stat & Set Evaluation** - Tracks correct main stats and recommended set bonuses (informational, no score penalty)
- **Automated Data Pipeline** - Character stats auto-fetched from Genshin Optimizer repo with manual weight curation
- **English + 简体中文** - Auto-detected from the browser and switchable in the header; character, weapon and artifact-set names use the game's own official translations. More languages can be added later — see `src/i18n/`
- **Dark/Light Theme** - Toggle between themes
- **Responsive** - Mobile-friendly expandable character cards

## Scoring Methodology

Based on the Fribbels HSR Optimizer, adapted for Genshin:

1. **Weighted Potential** - Each substat scored as `weight × value × potentialScale` where potentialScale normalizes all stats to CRIT DMG equivalent units
2. **Ideal Potential** - The theoretical maximum for that artifact slot given the character's weights (accounts for main stat exclusion)
3. **Potential Percent** - `(weighted / ideal) × 100`, displayed on a 0–200% scale where 100% ≈ 4.5 useful max rolls

### Grade Scale

| Score | Grade | Score | Grade |
|------:|:-----:|------:|:-----:|
| 170%+ | WTF+ | 100% | S |
| 160% | WTF | 90% | A+ |
| 150% | SSS+ | 80% | A |
| 140% | SSS | 70% | B+ |
| 130% | SS+ | 60% | B |
| 120% | SS | 50% | C+ |
| 110% | S+ | 40% | C |

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** (build)
- **TailwindCSS 4** (styling)
- **React Router v7** (routing)
- **TanStack Query v5** (data fetching)
- **Vitest** + fast-check (testing)

## Getting Started

```bash
git clone https://github.com/Xymoh/aurum.git
cd aurum
npm install
npm run dev
```

Opens at `http://localhost:3000`. Enter a Genshin UID (e.g., `707019355`) to view the showcase.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run fetch-locale` | Refresh localized game text for all 8 languages |
| `npm run fetch-pfps` | Refresh player profile-picture icons (run after a new patch) |
| `npm run fetch-hsr-weights` | Re-import per-character HSR scoring weights from Fribbels |
| `npm run fetch-hsr-stats` | Re-import HSR stat curves, traces and set bonuses |
| `npm run audit-genshin` | Cross-check Genshin substat weights against Prydwen, KQM and Game8 |

## Data Pipeline

**Patch day:** one command runs every fetcher below in order, tolerates a
failing source, and ends with what changed and which new characters still
need curated weights.

```bash
npm run refresh                       # everything
npm run refresh -- --only=hsr,hsr-weights
npm run refresh -- --skip=locale
```

The individual steps:

```bash
node scripts/fetch-go-data.js           # Fetch character stats from Genshin Optimizer
node scripts/fetch-enka-locale.js       # Fetch localized weapon/set names (Enka) + character names (Project Amber), all languages
node scripts/fetch-profile-pictures.js  # Fetch profile-picture id → icon mapping
```

**After a new game version:** re-run `fetch-profile-pictures.js`. Enka reports a
player's avatar as a ProfilePicture id whose mapping to an icon is arbitrary
(a release-order index, not derivable from a character id), so newly added
pictures can't be resolved until the upstream game data catches up. Unresolved
ids fall back to the player's initial and log a console warning naming the id.

Character substat weights and ideal main stats are manually curated in
`src/data/character-builds.json` and merged into
`genshin_optimizer_processed_data.json` by `fetch-go-data.js`. The pipeline
auto-generates default weights for new characters based on their ascension
stat.

The curated table is audited against Prydwen, KQM and Game8:

```bash
node scripts/audit-genshin-weights.mjs        # writes plans/genshin-weight-audit.md
```

The report lists every character where a guide's substat priority disagrees
with the table in a way that would change a score. It never edits weights
itself: guides give an ordering, the table gives magnitudes, and turning
"ER (until requirement) > CRIT > ATK%" into numbers is a judgement call.
Prydwen refuses plain HTTP clients, so the script drives the Edge that ships
with Windows through Playwright.

**Roll quality.** Enka's `appendPropIdList` names every roll on an artifact
and its tier (the last digit: 1 is 70% of the max roll, 4 is 100%), so each
substat shows one pip per roll coloured by tier, with the exact values in a
popover. Star Rail only reports a stat's roll count and combined quality, so
its pips share the stat's average tier.

## Zenless Zone Zero

A third scorer lives at `/zzz`. Enka serves ZZZ showcases at
`https://enka.network/api/zzz/uid/{uid}` (UIDs are 9 or 10 digits) and
publishes the game tables the parser needs (agents, disc sets, W-Engines, a
stat-id decoder, 13 locales); `scripts/fetch-zzz-data.mjs` writes compact
copies to `src/zzz/data/`.

**No roll quality.** Every substat entry carries `PropertyLevel` (rolls,
including the roll that created it) and `PropertyValue`, and `PropertyValue`
is the fixed worth of one roll: it is 300 (3.0%) for ATK% whether the stat
has one roll or four. Checked across a live profile. So a disc's substats are
exactly `rolls × a known amount`, the pips show roll counts only, and the
only luck in a disc is which stats the rolls landed on.

**Scoring** is the Star Rail construction with ZZZ's numbers: substats are
normalised to CRIT DMG units (one roll of anything is 4.8), weighted per
agent, and measured against the optimal disc for the slot (6 × best + the
next three, main stat excluded). Discs 1 to 3 have fixed mains; a disc 4, 5
or 6 whose main the agent cannot use gets a percent but no letter. The build
is the mean of the six slots. ZZZ has no reroll mechanic, so the account
panel is "replace first" rather than reroll advice.

**Weights** come from Prydwen's per-agent build guides, which list an ideal
main stat per disc and a ranked substat priority for every agent.
`scripts/fetch-zzz-weights.mjs` reads them and maps priority tiers onto the
discrete scale Fribbels uses (1 / 0.75 / 0.5 / 0.25); a "(Until 80%)"
qualifier becomes a threshold the build panel reports against. Prydwen's
Zenless pages sit behind a Cloudflare check that headless browsers fail, so
the script opens a visible Edge window (`ZZZ_HEADLESS=1` to try without).
Agents with no guide fall back to a role profile.

```bash
npm run fetch-zzz            # game tables
npm run fetch-zzz-weights    # Prydwen priorities -> src/zzz/data/scoring-metadata.json
```

## Character stats

All three scorers show the character's final stats, the same figures the
game's own character screen and Enka print. Each is checked against Enka for
a known UID, and those numbers are pinned in the tests:

| Game | Source | Verified against |
|---|---|---|
| Genshin | Enka reports them directly | n/a |
| Star Rail | `fetch-hsr-stats.mjs` (StarRailRes curves, traces, set bonuses, light cone passives) | Saber on `700600838` |
| Zenless | `fetch-zzz-data.mjs` (Enka agent curves + W-Engine multipliers) | Burnice on `1300064261` |

Conditional effects are deliberately excluded in both new engines: a light
cone's "when the wearer attacks" clause cannot be read from a showcase, and
Enka omits them too, so including them would put our numbers at odds with
both the game and every other showcase site. The unconditional half of a
light cone's passive **is** included, because the game always applies it.

Two things that are easy to get wrong and are pinned by tests:

- **Star Rail** light cone passives carry a flat stat bonus per
  superimposition. Saber's grants 36% CRIT DMG; without it the total reads
  165.8% instead of 201.8%.
- **Zenless** reports a fully ascended agent as promotion 6 while Enka's own
  promotion table has six rows indexed 0 to 5, so the lookup has to clamp or
  the entire promotion bonus silently vanishes (Burnice's HP drops from
  10,680 to 8,463).

## Adding a game

Navigation is driven entirely by `src/games/registry.ts`. Each entry also
carries a `shape`, which is the corner geometry its tab takes in the game
switcher when active: Genshin rounds, Star Rail notches two corners, Zenless
cuts a bevel. That is the trick that makes Enka's switcher read as several
separate tools rather than one bar, and the classes live in `index.css`. The picker at `/`,
the fixed side rail and the compact header switcher all iterate `GAMES`, so a
new game means:

1. Add an entry to `GAMES` (id, name, route prefix, icon, accent, `status`).
2. Drop its icon in `src/assets/games/`.
3. Mount its routes under that prefix in `src/App.tsx`.

No navigation component needs touching. A game can be listed with
`status: "planned"` to appear greyed out in the picker before its routes exist.

Routes are namespaced per game (`/genshin/...`, `/hsr/...`). The pre-split
`/showcase/:uid` links are redirected to `/genshin/showcase/:uid` rather than
broken, since those URLs are already shared.

## Honkai: Star Rail

A second scorer lives at `/hsr`, with its own layout, palette and data
pipeline. It shares only the router, the query client and the Enka transport
in `src/lib/enkaProxy.ts`.

It deliberately does **not** simulate damage. Fribbels' optimizer already does
that well, and matching it would mean per-character damage formulas rewritten
every patch. This answers the question a DPS score leaves open: *why* is the
build short.

Star Rail states how many upgrades landed on each substat (`cnt`) and how good
each one was (`step`), so nothing is inferred from a displayed value the way
the Genshin parser has to. That makes the aggregate view exact:

Both scorers now answer the same two questions in the same order, because
both games have the same two mechanics behind them:

1. **How much of this build is working?** Effective rolls against a benchmark.
2. **What should I spend on next?** Per-piece reroll advice, priced in the
   game's own currency: Dust of Enlightenment in Genshin, Variable Dice in
   Star Rail (added in 3.0, and functionally the same redistribution).

- **Relic score, 0-200** - the Fribbels relic score, reimplemented step for
  step (`src/hsr/scoring.ts`) and checked against their showcase for the same
  UID: every substat is normalised to CRIT DMG units (one max roll of anything
  is worth 6.48), weighted per character, and measured against the optimal
  relic for that slot: one max roll on each of the four best stats plus the
  five upgrades all on the best, with the main stat removed from the pool.
  200 is that optimum; the grade ladder is Fribbels' doubled (S at 100, SS at
  120, SSS at 140), which is also the Genshin ladder. A relic whose main stat
  the character cannot use keeps its percent but gets no letter.
- **Build score** - the mean of the six slots, as on Fribbels.
- **Useful rolls** - effective rolls against a 48-roll benchmark, out of the 54
  a build can hold. A build can carry more upgrades than the benchmark and
  still fall short, because a quarter of them sit on stats the character never
  uses. That gap is invisible to any per-piece grade.
- **Waste attribution** - which slot and which stat the dead rolls are on.
- Crit ratio, substat totals, set bonuses and main stat fit.

Character, light cone, relic, element and Path art is served from StarRailRes
via jsDelivr rather than bundled: ~200 MB of images stays out of the repo, and
every image is decorative, so the scorer reads correctly with all of them
missing.

Substat weights and ideal main stats are **per character**, imported from the
MIT-licensed Fribbels HSR Optimizer into `src/hsr/data/scoring-metadata.json`
(the file records the source commit). Reworked kits (`…B1.ts` upstream) win
over the original. A character missing from the table falls back to a Path
profile, so nothing goes ungraded, and `CHARACTER_OVERRIDES` in
`src/hsr/weights.ts` is the place to side with a guide over Fribbels for a
specific character.

Refresh the bundled game tables and the weights after a patch:

```bash
npm run fetch-hsr
GITHUB_TOKEN=$(gh auth token) node scripts/fetch-fribbels-weights.mjs
```

## Deployment

Hosted on GitHub Pages via GitHub Actions. On push to `main`, the workflow:
1. Installs dependencies
2. Builds with Vite
3. Deploys to GitHub Pages

Enka.Network does not send CORS headers, so the browser cannot call it directly.
In development the Vite dev server proxies `/api/proxy`. In production the app
calls a self-hosted Cloudflare Worker (free tier is plenty):

```bash
npx wrangler deploy workers/enka-proxy.js --name enka-proxy --compatibility-date 2024-01-01
```

Set the repository variable `VITE_ENKA_PROXY` (Settings -> Secrets and
variables -> Actions -> Variables) to the worker URL, e.g.
`https://enka-proxy.<subdomain>.workers.dev/`. The build picks it up.

Without that variable the app falls back to a single public CORS proxy
(allorigins.win). It is unreliable and it sees the user's UID, so treat it as
a stopgap rather than a deployment target.

There is no other backend: every data source besides Enka (Genshin Optimizer,
StarRailRes, Fribbels, Prydwen) is fetched by `scripts/` at build time and
committed as JSON.

## Acknowledgments

- [Enka.Network](https://enka.network/) - Genshin Impact showcase API
- [Fribbels HSR Optimizer](https://fribbels.github.io/hsr-optimizer/) - Scoring methodology inspiration
- [Genshin Optimizer](https://github.com/frzyc/genshin-optimizer) - Character stat data
