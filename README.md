# Artifact Aurum

Score your Genshin Impact artifacts like the pros. Enter a UID to instantly evaluate artifact quality across your entire showcase - per character, per piece.

**Live:** https://xymoh.github.io/genshin-artscore/

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
git clone https://github.com/Xymoh/genshin-artscore.git
cd genshin-artscore
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

## Data Pipeline

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

Character substat weights and ideal main stats are manually curated in `genshin_optimizer_processed_data.json`. The pipeline auto-generates default weights for new characters based on their ascension stat.

## Adding a game

Navigation is driven entirely by `src/games/registry.ts`. The picker at `/`,
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

- **Build score, 0-200** - the same scale as the per-piece grades and as the
  Genshin side, so every percentage on the page means the same kind of thing.
  100 is a solid build, 200 is every upgrade on the best stat at max quality.
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

Weights are keyed by **Path**, not per character, so a character released
tomorrow still scores sensibly instead of falling off a hand-written table.
`CHARACTER_OVERRIDES` in `src/hsr/weights.ts` handles the few kits that
contradict their Path (break carries, mainly).

Refresh the bundled game tables after a patch:

```bash
npm run fetch-hsr
```

## Deployment

Hosted on GitHub Pages via GitHub Actions. On push to `main`, the workflow:
1. Installs dependencies
2. Builds with Vite
3. Deploys to GitHub Pages

Enka.Network does not send CORS headers, so the browser cannot call it directly.
In development the Vite dev server proxies `/api/proxy`; in production the app
walks a list of public CORS proxies until one answers.

Those free proxies are unreliable (corsproxy.io now rejects anonymous requests
with `403 keyless_legacy_url`). For a stable deployment, host your own proxy:

```bash
npx wrangler deploy workers/enka-proxy.js --name enka-proxy --compatibility-date 2024-01-01
```

Then set the repository variable `VITE_ENKA_PROXY` (Settings -> Secrets and
variables -> Actions -> Variables) to the worker URL, e.g.
`https://enka-proxy.<subdomain>.workers.dev/`. The build picks it up and tries it
first, keeping the public proxies as a fallback.

## Acknowledgments

- [Enka.Network](https://enka.network/) - Genshin Impact showcase API
- [Fribbels HSR Optimizer](https://fribbels.github.io/hsr-optimizer/) - Scoring methodology inspiration
- [Genshin Optimizer](https://github.com/frzyc/genshin-optimizer) - Character stat data
