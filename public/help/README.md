# Help screenshots

The showcase guides at `/genshin/help/showcase`, `/hsr/help/showcase` and
`/zzz/help/showcase` show one screenshot per step, three steps per game. They
ship only when `VITE_SHOWCASE_HELP=on` is set at build time (a repository
variable for the deploy, or a line in `.env.local` for dev).

The files are listed in `src/help/content.ts`. A missing file shows a
labelled placeholder naming the file to add, so nothing breaks.

## Replacing a screenshot

Capture from the PC client in English, blur the UID and nickname, and convert
to WebP at 1600px wide so each file stays near 100 KB:

```bash
ffmpeg -i capture.png -vf "scale='min(1600,iw)':-2" -c:v libwebp -quality 82 public/help/<game>/<file>.webp
```

Full-size originals are kept locally in `.help-originals/`, which is
gitignored and never deployed.

| Game | File | Shows |
|---|---|---|
| genshin | `01-edit-profile.webp` | Paimon menu, pencil icon and Edit Profile |
| genshin | `02-character-showcase.webp` | Edit Profile, Character Showcase slots |
| genshin | `03-show-details.webp` | Show Character Details switched on |
| hsr | `01-trailblazer-profile.webp` | Phone menu, Trailblazer Profile |
| hsr | `02-character-showcase.webp` | Character Showcase, support and companion slots |
| hsr | `03-make-public.webp` | Settings, Social, profile Collection set to public |
| zzz | `01-profile.webp` | Main menu, profile at the top left |
| zzz | `02-personal-homepage.webp` | Personal Homepage, agent showcase row |
| zzz | `03-make-info-public.webp` | Social Media Settings, Make Info Public on |
