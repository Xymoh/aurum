/** Stable element id for a character panel, so other panels can scroll to it. */
export function characterPanelId(avatarId: number): string {
  return `hsr-character-${avatarId}`;
}
