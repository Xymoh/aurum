/** Flattens a Zenless agent's scoring metadata into the target model. */

import type { BuildListing, BuildTarget, TargetSlot, TargetStat, Translate } from "../lib/buildTarget/model";
import { rankSubstats } from "../lib/buildTarget/model";
import agentsData from "./data/agents.json";
import { agentIcon, agentImage, setIcon } from "./images";
import { SELECTABLE_ZZZ_SLOTS } from "./types";
import { getScoringMeta } from "./weights";

const AGENTS = agentsData as unknown as Record<
  string,
  { name: string; nameZh?: string; profession: string; element: string; rarity: number; accent: string }
>;

/** Prydwen keys its guides by a slug of the agent's name. */
function prydwenUrl(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `https://www.prydwen.gg/zenless/characters/${slug}`;
}

export function listZzzBuilds(t: Translate): BuildListing[] {
  return Object.entries(AGENTS)
    .map(([id, a]) => ({
      id,
      name: a.name,
      iconUrl: agentIcon(Number(id)),
      tags: [t("zzzRoles", a.profession as "Attack"), t("zzzElements", a.element as "Fire")],
      rarity: a.rarity,
      generic: getScoringMeta(Number(id)).source !== "prydwen",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getZzzBuild(id: string, t: Translate): BuildTarget | null {
  const agent = AGENTS[id];
  if (!agent) return null;

  const agentId = Number(id);
  const meta = getScoringMeta(agentId);

  // Slots 1 to 3 have fixed main stats; only 4, 5 and 6 are a choice.
  const slots: TargetSlot[] = SELECTABLE_ZZZ_SLOTS.map((slot) => ({
    slot: t("zzzSlots", String(slot) as "1"),
    stats: (meta.parts[slot] ?? []).map((stat) => t("zzzStats", String(stat) as "11101")),
  }));

  const substats: TargetStat[] = rankSubstats(
    Object.entries(meta.stats).map(([id, weight]) => ({
      label: t("zzzStats", id as "11101"),
      weight,
    })),
  );

  return {
    game: "zzz",
    id,
    name: agent.name,
    iconUrl: agentIcon(agentId),
    portraitUrl: agentImage(agentId),
    tags: [t("zzzRoles", agent.profession as "Attack"), t("zzzElements", agent.element as "Fire")],
    rarity: agent.rarity,
    accent: agent.accent || "#d4ff00",
    generic: meta.source !== "prydwen",
    slots,
    substats,
    sets: meta.sets.map((parts) => ({
      parts: parts.map((p) => ({ name: p.name, pieces: p.pieces, iconUrl: setIcon(Number(p.setId)) })),
    })),
    // Their own wording, quoted rather than paraphrased: the tiers behind the
    // weights are an interpretation, and the sentence is not.
    priority: meta.priority,
    thresholds: Object.entries(meta.thresholds).map(([id, target]) => ({
      label: t("zzzStats", id as "11101"),
      target,
    })),
    energyTarget: null,
    source: {
      label: "Prydwen",
      url: meta.source === "prydwen" ? prydwenUrl(agent.name) : "https://www.prydwen.gg/zenless/characters/",
    },
    setsSource: null,
  };
}
