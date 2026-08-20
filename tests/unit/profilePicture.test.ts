import { describe, it, expect } from "vitest";
import { parseShowcaseData } from "../../src/lib/parsing";
import type { EnkaResponse } from "../../src/types/enka";

/** Minimal Enka payload - only playerInfo matters for avatar resolution. */
function makeResponse(profilePicture: unknown): EnkaResponse {
  return {
    uid: "700000000",
    ttl: 60,
    playerInfo: {
      nickname: "Tester",
      level: 60,
      worldLevel: 9,
      nameCardId: 210001,
      profilePicture,
    },
  } as EnkaResponse;
}

describe("profile picture resolution", () => {
  it("resolves a ProfilePicture id to its icon name", () => {
    // 11500 is Lohen's profile picture in ProfilePictureExcelConfigData.
    const result = parseShowcaseData(makeResponse({ id: 11500 }));
    expect(result.playerInfo.avatarIcon).toBe("UI_AvatarIcon_Lohen_Circle");
  });

  it("resolves the default Traveler profile pictures", () => {
    expect(parseShowcaseData(makeResponse({ id: 1 })).playerInfo.avatarIcon).toBe(
      "UI_AvatarIcon_PlayerBoy_Circle",
    );
    expect(parseShowcaseData(makeResponse({ id: 2 })).playerInfo.avatarIcon).toBe(
      "UI_AvatarIcon_PlayerGirl_Circle",
    );
  });

  it("falls back to the character icon for legacy avatarId responses", () => {
    // Older Enka payloads sent a character id rather than a ProfilePicture id.
    const result = parseShowcaseData(makeResponse({ avatarId: 10000002 }));
    expect(result.playerInfo.avatarIcon).toBe("UI_AvatarIcon_Ayaka");
  });

  it("returns an empty icon rather than a broken one when unresolvable", () => {
    // The UI treats "" as "show the fallback", so an unknown id must not
    // produce a string that would build a 404 image URL.
    expect(parseShowcaseData(makeResponse({ id: 99999999 })).playerInfo.avatarIcon).toBe("");
    expect(parseShowcaseData(makeResponse(undefined)).playerInfo.avatarIcon).toBe("");
    expect(parseShowcaseData(makeResponse({})).playerInfo.avatarIcon).toBe("");
  });

  it("degrades cleanly for a picture newer than the bundled table", () => {
    // 100280 shipped in a patch after the upstream game data we build from,
    // so it cannot be resolved - it must fall back, not emit a broken URL.
    expect(parseShowcaseData(makeResponse({ id: 100280 })).playerInfo.avatarIcon).toBe("");
  });

  it("prefers the id mapping over a legacy avatarId when both are present", () => {
    const result = parseShowcaseData(makeResponse({ id: 11500, avatarId: 10000002 }));
    expect(result.playerInfo.avatarIcon).toBe("UI_AvatarIcon_Lohen_Circle");
  });
});
