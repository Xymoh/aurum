# Help screenshots

The guides are hidden until `VITE_SHOWCASE_HELP=on` is set at build time
(a repository variable for the deploy, or a line in `.env.local` for dev).
Add the screenshots first, then flip the flag.

The showcase guides at `/genshin/help/showcase`, `/hsr/help/showcase` and
`/zzz/help/showcase` look for one image per step in the folders below. A
missing file shows a labelled placeholder on the page naming the file to add,
so nothing breaks while these are empty.

Capture from the PC client in English at 1080p or higher, crop to the part of
the screen the step is about, and save as PNG (or WebP with the same base name
and update `src/help/content.ts`). Keep each under about 200 KB; the page
lazy-loads them.

## genshin/

| File | Show |
|---|---|
| `01-profile-card.png` | The Paimon menu with the profile card at the top left highlighted |
| `02-character-showcase.png` | Edit Profile -> Character Showcase, with the eight slots and the add button |
| `03-show-details.png` | The Show Character Details toggle, switched on |
| `04-refresh.png` | The site's Refresh button on a showcase page |

## hsr/

| File | Show |
|---|---|
| `01-profile.png` | The phone menu with the Trailblazer profile at the top left |
| `02-character-showcase.png` | The profile editor's character showcase with the eight slots |
| `03-display-details.png` | The switch that displays character details to other players, switched on |
| `04-refresh.png` | The site's Refresh button on a showcase page |

## zzz/

| File | Show |
|---|---|
| `01-inter-knot-profile.png` | The main menu with the Inter-Knot profile at the top left |
| `02-agent-showcase.png` | The profile editor's agent showcase |
| `03-display-details.png` | The switch that shows agent details to other players, switched on |
| `04-refresh.png` | The site's Refresh button on a showcase page |
