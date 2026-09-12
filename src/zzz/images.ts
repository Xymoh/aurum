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
import artFocus from "./data/art-focus.json";

const CDN = "https://enka.network";

const AGENTS = agents as Record<string, { image: string; circleIcon: string }>;
const SETS = sets as Record<string, { icon: string }>;
const WEAPONS = weapons as Record<string, { image: string }>;
const PFPS = pfps as Record<string, string>;
const ART_FOCUS = (artFocus as { agents: Record<string, { x: number; y: number }> }).agents;

/** Where most faces sit: a little right of centre is as common as left. */
const DEFAULT_FOCUS = { x: 0.5, y: 0.15 };

/**
 * Where the agent's face sits in their render, as fractions of its width
 * and height. Measured by scripts/measure-zzz-art.mjs; the default is the
 * typical render, for an agent that has not been measured yet.
 */
export function agentArtFocus(id: number): { x: number; y: number } {
  return ART_FOCUS[String(id)] ?? DEFAULT_FOCUS;
}

/**
 * The `object-position` row, as a percentage, that puts the face mid-banner.
 *
 * With `object-cover` on a wide, short box the render is scaled to the
 * box's width and the box shows a window about a fifth of the image tall.
 * `object-position: center P%` aligns the image's P% row with the box's
 * P% row, so the face row f lands in the middle when P = (f - w/2)/(1 - w)
 * for a window w; the constants are that formula at a typical width. The
 * old fixed 6% is what this gives for a face at 15%, which is most agents;
 * Claret, whose scythe pushes her face down to 26%, gets 20% and stops
 * being cut off at the banner's bottom edge.
 */
export function agentArtOffsetY(id: number): number {
  const p = (agentArtFocus(id).y - 0.1) / 0.8;
  return Math.round(Math.max(0.02, Math.min(0.35, p)) * 100);
}

/**
 * Horizontal shift, as a percentage of the art box, that moves the face
 * toward the box's centre. The render fills the box edge to edge sideways,
 * so `object-position` cannot move it; a transform can.
 *
 * Clamped on the right: shifting an image left exposes the box's right
 * edge, and past 15% that edge shows through the panel's wash. Exposure on
 * the left sits under the fade and is never seen.
 */
export function agentArtShift(id: number): number {
  const shift = 0.5 - agentArtFocus(id).x;
  return Math.round(Math.max(-0.15, Math.min(0.25, shift)) * 100);
}

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
