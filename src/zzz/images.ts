/**
 * Image URLs for Zenless Zone Zero, all served by Enka.
 *
 * Enka's ZZZ store gives every agent, disc set and W-Engine a path under
 * /ui/zzz/, so there is nothing to bundle beyond the paths themselves.
 */

import agents from "./data/agents.json";
import sets from "./data/sets.json";
import weapons from "./data/weapons.json";
import pfps from "./data/pfps.json";

const CDN = "https://enka.network";

const AGENTS = agents as Record<string, { image: string; circleIcon: string }>;
const SETS = sets as Record<string, { icon: string }>;
const WEAPONS = weapons as Record<string, { image: string }>;
const PFPS = pfps as Record<string, string>;

/** Full-body art, for the panel banner. */
export function agentImage(id: number): string | null {
  const a = AGENTS[String(id)];
  return a ? `${CDN}${a.image}` : null;
}

/** Round bust, for list rows. */
export function agentIcon(id: number): string | null {
  const a = AGENTS[String(id)];
  return a ? `${CDN}${a.circleIcon}` : null;
}

export function setIcon(setId: number): string | null {
  const s = SETS[String(setId)];
  return s ? `${CDN}${s.icon}` : null;
}

export function engineImage(id: number): string | null {
  const w = WEAPONS[String(id)];
  return w ? `${CDN}${w.image}` : null;
}

export function profilePicture(profileId: number): string | null {
  const p = PFPS[String(profileId)];
  return p ? `${CDN}${p}` : null;
}
