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
time from Enka.Network and StarRailRes. Use of that material follows
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
  repository through jsDelivr, and the `index_min/en` tables (characters,
  relics, sets, light cones, stat curves) that `scripts/fetch-hsr-data.js` and
  `scripts/fetch-hsr-stats.mjs` turn into the JSON under `src/hsr/data/`.
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

- Sources: https://gitlab.com/Dimbreath/AnimeGameData and
  https://github.com/DimbreathBot/AnimeGameData
- What we use: Genshin profile picture ids (`scripts/fetch-profile-pictures.js`)
  and weapon ids (`scripts/build-weapon-ids.js`).
- These are unlicensed mirrors of HoYoverse's own data files; the content is
  HoYoverse's.

## Project Amber (gi.yatta.moe)

- What we use: localised character and weapon names through its public API,
  fetched by `scripts/fetch-enka-locale.js` and `scripts/build-weapon-ids.js`.

## Prydwen and genshin.gg

- Sources: https://www.prydwen.gg/ and https://genshin.gg/
- What we use: the recommended main stats, substat priorities and sets that
  each guide lists per character. Only those facts are imported, as tables in
  `src/*/data/scoring-metadata.json` and `set-recommendations.json`; no guide
  text, artwork or layout is copied. Each imported entry records the guide URL
  it came from, and the site links both guides in its footers.

## Fonts

- Inter (https://github.com/rsms/inter) and JetBrains Mono
  (https://github.com/JetBrains/JetBrainsMono), bundled through Fontsource
  under the SIL Open Font License 1.1.

## npm packages

Runtime dependencies (React, React Router, TanStack Query, Tailwind CSS) are
MIT-licensed; their notices ship inside `node_modules` and are not reproduced
here.
