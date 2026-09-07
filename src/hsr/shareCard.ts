/** Flattens a Star Rail character into the shared share-card model. */

import type { ShareCardModel, ShareContext } from "../lib/shareCard/model";
import { characterPreview, lightConeIcon, relicIcon } from "./images";
import { elementTint } from "./labels";
import { SLOT_COUNT } from "./scoring";
import { statRowFor } from "./stats";
import type { HsrCharacter } from "./types";

export function hsrShareCard(character: HsrCharacter, ctx: ShareContext): ShareCardModel {
  const { t } = ctx;
  const d = character.diagnostics;

  return {
    game: "hsr",
    uid: ctx.uid,
    playerName: ctx.playerName,
    name: character.name,
    level: `Lv${character.level}`,
    rank: `E${character.eidolon}`,
    tags: [t("hsrPaths", character.path as "Warrior")],
    portraitUrl: characterPreview(character.avatarId),
    // Matches the panel's object-[center_30%]: these are 376x512 portraits
    // with the face high in the frame.
    portraitFocus: { x: 0.5, y: 0.3 },
    accent: elementTint(character.element),
    gear: character.lightCone
      ? {
          name: character.lightCone.name,
          iconUrl: lightConeIcon(character.lightCone.id),
          refine: `S${character.lightCone.superimposition}`,
        }
      : null,
    score: {
      value: d.score,
      grade: d.grade,
      complete: d.complete,
      note: t("shareCard", "pieces", { filled: character.relics.length, total: SLOT_COUNT }),
    },
    footnote: t("shareCard", "rolls", { effective: d.effectiveRolls, total: d.totalRolls }),
    stats: statRowFor(character).map((s) => ({ label: t("hsr", s.label), value: s.value })),
    pieces: character.relics.map((relic) => ({
      iconUrl: relicIcon(relic.tid),
      slot: t("hsrSlots", relic.slot),
      score: relic.score.potentialPercent,
      grade: relic.score.grade,
    })),
  };
}
