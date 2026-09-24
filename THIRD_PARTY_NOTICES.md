# Third-party notices

Aurum's own code is MIT-licensed (see [LICENSE](LICENSE)). That licence covers
the scoring engine, the site and the scripts. It does **not** cover the game
assets the site shows or the data the scripts import, which stay under their
owners' terms as listed here. If you fork this project, these obligations come
with it.

## Game content: HoYoverse

Genshin Impact, Honkai: Star Rail and Zenless Zone Zero, and every character,
weapon, artifact, relic, disc, name, icon and splash shown on the site, are the
property of COGNOSPHERE PTE. LTD. and miHoYo Co., Ltd. Aurum is an independent,
non-commercial fan work and is not affiliated with or endorsed by HoYoverse.
Game artwork is not stored in this repository; the browser loads it at view
time from Enka.Network, StarRailRes and, for Genshin material and element
icons, Project Amber. The one exception is the Zenless Zone Zero material icons, kept as
96px copies under `public/zzz/items/` (see nanoka.cc below). Use of that
material follows
HoYoverse's fan-created content guidelines and is limited to identifying and
describing in-game items.

## Enka.Network

- Source: https://enka.network/ and https://github.com/EnkaNetwork/API-docs
- What we use: the showcase API (`/api/uid`, `/api/hsr/uid`, `/api/zzz/uid`),
  the UI asset CDN (`enka.network/ui`) and the `store/` tables from the
  API-docs repository for item names, localisation and stat tables.
- Terms: Enka asks clients to send a custom `User-Agent`, to respect the `ttl`
  each response carries by not re-requesting a UID before it expires, and never
  to enumerate UIDs or run bulk query jobs. It applies dynamic rate limits.
- How Aurum complies: the relay in `workers/enka-proxy.js` identifies itself
  as `Aurum/0.1 (+https://github.com/Xymoh/aurum)`, caches each answer for
  the ttl at the edge, the client refuses to refetch before the ttl runs out,
  and the relay serves only this site's origin with a per-address cap, so it
  cannot be used for bulk queries by anyone else.

## Fribbels HSR Optimizer

- Source: https://github.com/fribbels/hsr-optimizer
- What we use: the relic scoring methodology, reimplemented in
  `src/lib/scoring.ts` and `src/hsr/scoring.ts`, and the per-character stat
  weights imported into `src/hsr/data/scoring-metadata.json` by
  `scripts/fetch-fribbels-weights.mjs`.
- Licence: MIT. The notice below is reproduced as that licence requires.

```
MIT License

Copyright (c) 2024 Fribbels

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Genshin Optimizer

- Source: https://github.com/frzyc/genshin-optimizer
- What we use: character base stats, ascension stats and scaling attributes
  from `libs/gi/stats/src/allStat_gen.json`, processed into
  `src/data/genshin-optimizer.json` by `scripts/fetch-go-data.js`.
- Licence: MIT. The notice below is reproduced as that licence requires.

```
MIT License

Copyright (c) 2020-present, frzyc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## StarRailRes (Mar-7th)

- Source: https://github.com/Mar-7th/StarRailRes
- What we use: Honkai: Star Rail artwork, loaded by the browser from the
  repository through jsDelivr (`cdn.jsdelivr.net`, or jsDelivr's second
  network `fastly.jsdelivr.net` when a request fails), and the
  `index_min/en` tables (characters,
  relics, sets, light cones, stat curves) that `scripts/fetch-hsr-data.js` and
  `scripts/fetch-hsr-stats.mjs` turn into the JSON under `src/hsr/data/`. The
  build pages add skill, trace and Eidolon text, promotion and trace costs,
  Light Cone passives and relic set bonuses from the same tables, written by
  `scripts/build-hsr-guides.mjs` to `src/hsr/data/guides/` and
  `src/hsr/data/set-bonuses.json`.
- Licence: AGPL-3.0 for the repository. Aurum does not include or link any
  StarRailRes code; it uses the repository as a mirror of HoYoverse's game data,
  which StarRailRes itself takes from Dimbreath/StarRailData. The game data and
  artwork remain HoYoverse's, as above. This project's full source is public
  in any case.

## Yidhari-ZS

- Source: https://github.com/yidhari-zs/Yidhari-ZS
- What we use: the W-Engine growth curves from `assets/Filecfg`, read by
  `scripts/fetch-zzz-data.mjs` into `src/zzz/data/weapon-curves.json`.
- Licence: AGPL-3.0 for the repository, used as a mirror of game data only, on
  the same basis as StarRailRes.

## Dimbreath game data mirrors

- Sources: https://gitlab.com/Dimbreath/AnimeGameData,
  https://github.com/DimbreathBot/AnimeGameData and
  https://git.mero.moe/dimbreath/ZenlessData
- What we use: Genshin profile picture ids (`scripts/fetch-profile-pictures.js`)
  and weapon ids (`scripts/build-weapon-ids.js`); for the Zenless build pages,
  skill, core skill and Mindscape text, promotion and skill costs, W-Engine
  passives and disc set bonuses from ZenlessData's config tables and English
  text map, written by `scripts/build-zzz-guides.mjs` to
  `src/zzz/data/guides/` and `src/zzz/data/set-bonuses.json`.
- These are unlicensed mirrors of HoYoverse's own data files; the content is
  HoYoverse's.

## Project Amber (gi.yatta.moe)

- What we use: localised character and weapon names through its public API,
  fetched by `scripts/fetch-enka-locale.js` and `scripts/build-weapon-ids.js`;
  for the Genshin build pages, talent, passive and constellation text with
  talent scaling, ascension and talent costs, weapon stats and passives and
  artifact set bonuses, written by `scripts/build-genshin-guides.mjs` to
  `src/data/guides/` and `src/data/set-bonuses.json`, with the Traveler's
  kit and materials read per element. The browser loads material and
  element icons from its asset host (`gi.yatta.moe/assets/UI`), because
  Enka.Network does not serve icons for items added from Natlan onwards, nor
  the Cryo element icon.

## nanoka.cc

- Source: https://zzz.nanoka.cc/ (asset host `static.nanoka.cc`)
- What we use: the Zenless Zone Zero material icons, fetched by
  `scripts/build-zzz-guides.mjs` under the sprite names the game's item table
  gives them, reduced to 96px (a boss drop's animated sheet to its first
  frame) and kept under `public/zzz/items/`. Visitors' browsers load them
  from this site, never from nanoka.cc.
- The icons are HoYoverse's game art, as above; nanoka.cc hosts copies
  extracted from the game.

## Prydwen, Game8 and genshin.gg

- Sources: https://www.prydwen.gg/ (Star Rail, Zenless), https://game8.co/
  (Genshin) and https://genshin.gg/ (Genshin characters Game8 has no build
  page for). Game8 serves its pages to ordinary clients under its
  robots.txt; the import reads one page at a time at a polite pace.
- What we use: the recommended main stats, substat priorities and sets that
  each guide lists per character, and for the build pages the ranked weapons
  (with the refinement a guide ranks them at), recommended teams and partners,
  role label, substat line, endgame stat targets, skill and trace level-up
  order, and the date each page says it was last updated. Only those facts
  are imported, as tables in `src/*/data/scoring-metadata.json`,
  `set-recommendations.json` and `guide-picks.json`; no guide text,
  commentary, calculated damage figures, usage statistics, artwork or layout
  is copied. Each imported entry records the guide URL it came from, and
  each build page credits and links its guide, with that date, under its
  header and under "Sources".

## Fonts

- Inter (https://github.com/rsms/inter) and JetBrains Mono
  (https://github.com/JetBrains/JetBrainsMono), bundled through Fontsource
  under the SIL Open Font License 1.1.

## npm packages

Runtime dependencies (React, React Router, TanStack Query, Tailwind CSS) are
MIT-licensed; their notices ship inside `node_modules` and are not reproduced
here. `sharp` (Apache-2.0, with libvips under LGPL-3.0) only runs in the
build scripts to shrink icons; none of it ships with the site.
