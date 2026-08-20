# Fix Plan: Character Mapping + Fribbels-Style CSS Overhaul

## Issue 1: Wrong Character Names

**Root Cause**: Enka API returns avatarId `10000131` and `10000132` for Nicole and Lohen respectively, but `characters.json` maps these IDs to "Zibai" and "Columbina".

**Fix**: Update [`src/data/characters.json`](src/data/characters.json) entries:
- ID `10000131` → name: "Nicole", element: "Pyro", weapon: "Catalyst", icon: "UI_AvatarIcon_Nicole"
- ID `10000132` → name: "Lohen", element: "Cryo", weapon: "Sword", icon: "UI_AvatarIcon_Lohen"

## Issue 2: CSS Overhaul - Fribbels-Style Sizing & Layout

The user reports the UI is "too small" and doesn't match Fribbels' showcase. The following components need specific size/scale adjustments to replicate Fribbels' pixel-perfect layout.

### Affected Files

| File | What to change |
|------|----------------|
| [`src/index.css`](src/index.css) | Increase base font size, add Fribbels-style utility classes, enhance grade badges, add tierlist card styles |
| [`src/components/showcase/CharacterDetail.tsx`](src/components/showcase/CharacterDetail.tsx) | Significantly larger portrait (w-32 h-32 → sm:w-40 sm:h-40), bigger grade badge overlay, larger text throughout, wider artifact table grid columns |
| [`src/components/showcase/ArtifactRow.tsx`](src/components/showcase/ArtifactRow.tsx) | Larger icons (w-12 h-12), bigger substat dots, expanded grid columns, larger score badge |
| [`src/components/showcase/CharacterStrip.tsx`](src/components/showcase/CharacterStrip.tsx) | Larger thumbnails (w-20 h-20), bigger grade overlay, larger name labels |
| [`src/components/ui/BuildScoreBar.tsx`](src/components/ui/BuildScoreBar.tsx) | Much larger grade letter (text-5xl or bigger), thicker progress bar, bigger score number |
| [`src/components/ui/SetBonusRow.tsx`](src/components/ui/SetBonusRow.tsx) | Larger set icons, bigger pill tags, more spacing |
| [`src/components/ui/ScoreBadge.tsx`](src/components/ui/ScoreBadge.tsx) | Larger badge size, bigger font |
| [`src/components/ui/SubstatDots.tsx`](src/components/ui/SubstatDots.tsx) | Larger dots, bigger stat labels |
| [`src/components/showcase/PlayerHeader.tsx`](src/components/showcase/PlayerHeader.tsx) | More padding, larger avatar, bigger buttons |
| [`src/pages/ShowcasePage.tsx`](src/pages/ShowcasePage.tsx) | Max width constraints, more spacing between sections |
| [`src/components/ui/LoadingSkeleton.tsx`](src/components/ui/LoadingSkeleton.tsx) | Match increased sizes |

### Specific Pixel Dimensions to Target (Fribbels-like)

- **Character portrait**: 160×160px (w-40 h-40) instead of current 96×96px (w-24 h-24)
- **Grade badge overlay on portrait**: 56×56px badge instead of current 40×40px
- **Artifact icon**: 56×56px (w-14 h-14) instead of current 36×36px (w-9 h-9)
- **Character strip thumbnails**: 88×88px (w-22 h-22) rounded instead of current 64×64px (w-16 h-16)
- **Score badge**: 36px height instead of 28px, bigger font
- **Build score grade letter**: text-6xl (60px) instead of text-4xl
- **Progress bar**: h-4 (16px) instead of current ~8px
- **Base font**: Bump up to 17px or 18px base, increase all text sizes
- **Spacing**: Increase gap/padding by ~1.5× in most containers
- **Artifact table**: Wider grid, more padding, full bleed width
- **Max content width**: 1280px (max-w-7xl) to fill available space better

### CSS Additions (src/index.css)

Add Fribbels-inspired classes:
```css
.grade-tier-list
.score-pill
.stat-label-text
```

### Implementation Order

1. Fix `characters.json` mapping (10000131=Nicole, 10000132=Lohen)
2. Update `index.css` with Fribbels-scale classes and larger base sizing
3. Resize `CharacterDetail.tsx` - largest portrait, bigger everything
4. Resize `ArtifactRow.tsx` - bigger icons, grid, score
5. Resize `CharacterStrip.tsx` - bigger thumbnails, labels
6. Resize `BuildScoreBar.tsx` - massive grade letter
7. Resize `SetBonusRow.tsx` - bigger tags/icons
8. Resize `ScoreBadge.tsx` + `SubstatDots.tsx` - bigger display
9. Resize `PlayerHeader.tsx` - more padding, bigger elements
10. Update `ShowcasePage.tsx` - wider layout, more spacing
11. Update `LoadingSkeleton.tsx` - match new sizes
12. Build & verify zero TypeScript errors
