/** Flattens a Zenless agent into the shared share-card model. */

import type { ShareCardModel, ShareContext } from "../lib/shareCard/model";
import { agentImage, setIcon } from "./images";
import { SLOT_COUNT } from "./scoring";
import { zzzStatRow } from "./stats";
import type { ZzzAgent } from "./types";
import { getAgentInfo } from "./weights";

export function zzzShareCard(agent: ZzzAgent, ctx: ShareContext): ShareCardModel {
  const { t } = ctx;
  const d = agent.diagnostics;

  return {
    game: "zzz",
    uid: ctx.uid,
    playerName: ctx.playerName,
    name: agent.name,
    level: `Lv${agent.level}`,
    rank: `M${agent.mindscape}`,
    tags: [t("zzzRoles", agent.profession as "Attack"), t("zzzElements", agent.element as "Fire")],
    portraitUrl: agentImage(agent.id),
    // Matches the panel's object-[center_6%]: these are full-body renders,
    // so anything lower crops the head off.
    portraitFocus: { x: 0.5, y: 0.06 },
    accent: getAgentInfo(agent.id)?.accent ?? "#d4ff00",
    gear: agent.engine
      ? {
          name: agent.engine.name,
          iconUrl: agent.engine.image || null,
          refine: `P${agent.engine.rank}`,
        }
      : null,
    score: {
      value: d.score,
      grade: d.grade,
      complete: d.complete,
      note: t("shareCard", "pieces", { filled: agent.discs.length, total: SLOT_COUNT }),
    },
    footnote: t("shareCard", "rolls", { effective: d.effectiveRolls, total: d.totalRolls }),
    stats: zzzStatRow(agent.stats).map((s) => ({ label: t("zzz", s.label), value: s.value })),
    pieces: agent.discs.map((disc) => ({
      iconUrl: setIcon(disc.setId),
      slot: t("zzzSlots", String(disc.slot) as "1"),
      score: disc.score.potentialPercent,
      grade: disc.score.grade,
    })),
  };
}
