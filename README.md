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

## Deployment

Hosted on GitHub Pages via GitHub Actions. On push to `main`, the workflow:
1. Installs dependencies
2. Builds with Vite
3. Deploys to GitHub Pages

In production, the app calls Enka.Network directly (CORS allowed). No serverless functions needed.

## Acknowledgments

- [Enka.Network](https://enka.network/) - Genshin Impact showcase API
- [Fribbels HSR Optimizer](https://fribbels.github.io/hsr-optimizer/) - Scoring methodology inspiration
- [Genshin Optimizer](https://github.com/frzyc/genshin-optimizer) - Character stat data
