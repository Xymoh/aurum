import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { BuildDetail, type GuideState } from "../../src/components/builds/BuildDetail";
import type { BuildSkin } from "../../src/components/builds/skin";
import { I18nProvider } from "../../src/i18n/I18nProvider";
import type { GuideFile } from "../../src/lib/buildTarget/guide";
import type { BuildListing, BuildTarget } from "../../src/lib/buildTarget/model";

// React warns about act() outside a test environment that declares it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SKIN: BuildSkin = {
  panel: "", card: "", cardHover: "", text: "", muted: "", accent: "", line: "", field: "", active: "active", bar: "",
};

const TARGET: BuildTarget = {
  game: "genshin",
  id: "10000046",
  name: "Hu Tao",
  iconUrl: null,
  portraitUrl: null,
  tags: ["Pyro", "Polearm"],
  rarity: 5,
  generic: false,
  accent: "#f97316",
  slots: [{ slot: "Sands", stats: ["HP%"] }],
  substats: [{ label: "CRIT DMG", weight: 1 }],
  sets: [{ label: "Best-in-Slot", parts: [{ setId: "15006", name: "Crimson Witch of Flames", pieces: 4, iconUrl: null }] }],
  priority: null,
  thresholds: [],
  energyTarget: null,
  source: { label: "Genshin Optimizer", url: null },
  setsSource: null,
};

const GUIDE: GuideFile = {
  role: "Main DPS",
  weapons: [
    { id: "13501", name: "Staff of Homa", iconUrl: null, rarity: 5, refinement: null, stats: [{ label: "Base ATK", value: "608" }], passive: { name: "Reckless Cinnabar", text: "HP increased by **20/25/30/35/40%**." } },
  ],
  teams: [{ name: "Hu Tao Vaporize", members: ["10000046", "10000025"], alternates: [[], ["10000023"]] }],
  synergies: [],
  substatLine: "CRIT Rate / CRIT DMG > Elemental Mastery > HP%",
  endgameStats: [],
  skillPriority: null,
  tracePriority: null,
  source: { label: "Game8", url: "https://game8.co/games/Genshin-Impact/archives/314347", updated: "2026-09-20" },
  kitChangedAt: null,
  kitHash: "0000000000000000",
  baseStats: [{ label: "HP", value: "15,552" }],
  bonusStats: [{ label: "CRIT DMG", value: "38.4%" }],
  kit: [
    { id: "skills", entries: [{ kind: "Elemental Skill", name: "Guide to Afterlife", text: "Enters **Paramita Papilio**.", iconUrl: null, scaling: { levels: [1, 10], rows: [{ label: "ATK Increase", values: ["3.84%", "6.26%"] }] } }] },
    { id: "constellations", entries: [{ kind: "C1", name: "Crimson Bouquet", text: "No Stamina cost.", iconUrl: null }] },
  ],
  materials: [{ id: "ascension", items: [{ id: "202", name: "Mora", iconUrl: null, rarity: 3, count: 420000 }] }],
};

const ROSTER = new Map<string, BuildListing>([
  ["10000025", { id: "10000025", name: "Xingqiu", iconUrl: null, tags: [], rarity: 4, generic: false }],
  ["10000023", { id: "10000023", name: "Xiangling", iconUrl: null, tags: [], rarity: 4, generic: false }],
  [
    "10000005-cryo",
    {
      id: "10000005-cryo",
      name: "Traveler (Cryo)",
      iconUrl: "https://enka.network/ui/UI_AvatarIcon_PlayerBoy.png",
      tags: ["Cryo", "Sword"],
      rarity: 0,
      generic: false,
      badge: { iconUrl: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Ice.png", label: "Cryo" },
    },
  ],
]);

let root: Root | null = null;
let host: HTMLElement | null = null;

function render(guide: GuideState, equippedWeaponId?: string) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <I18nProvider>
        <MemoryRouter>
          <BuildDetail target={TARGET} basePath="/genshin/builds" skin={SKIN} guide={guide} roster={ROSTER} equippedWeaponId={equippedWeaponId} />
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const loaded: GuideState = {
  guide: GUIDE,
  setBonuses: { "15006": { name: "Crimson Witch of Flames", bonuses: [{ pieces: 2, text: "Pyro DMG Bonus +15%" }, { pieces: 4, text: "Overloaded DMG +40%" }] } },
  loading: false,
  failed: false,
};

describe("BuildDetail", () => {
  it("lists a nav entry for every section the guide can fill", () => {
    const page = render(loaded);
    const nav = [...page.querySelectorAll("nav button")].map((b) => b.textContent);
    expect(nav).toEqual(["Build", "Weapons", "Teams", "Skills", "Constellations", "Materials"]);
  });

  it("shows the weapons, the passive text and the guide's role", () => {
    const page = render(loaded);
    expect(page.textContent).toContain("Staff of Homa");
    expect(page.querySelector("strong")?.textContent).toBeTruthy();
    expect(page.textContent).toContain("20/25/30/35/40%");
    expect(page.textContent).toContain("Main DPS");
  });

  it("marks the weapon the visitor's own character wields", () => {
    expect(render(loaded).textContent).not.toContain("Equipped");
    act(() => root?.unmount());
    host?.remove();
    expect(render(loaded, "13501").textContent).toContain("Equipped");
  });

  it("links teammates to their own build pages but not the page's own character", () => {
    const page = render(loaded);
    const links = [...page.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(links).toContain("/genshin/builds/10000025");
    expect(links).not.toContain("/genshin/builds/10000046");
  });

  it("gives a 4-piece both of its set effects", () => {
    const page = render(loaded);
    expect(page.textContent).toContain("Pyro DMG Bonus +15%");
    expect(page.textContent).toContain("Overloaded DMG +40%");
  });

  it("keeps the stat targets on screen while the guide is still loading", () => {
    const page = render({ guide: null, setBonuses: {}, loading: true, failed: false });
    expect(page.textContent).toContain("HP%");
    expect(page.textContent).toContain("Loading the rest of the guide");
    expect(page.querySelector("nav")).toBeNull();
  });

  it("credits the guide with the date the guide itself gives", () => {
    const page = render(loaded);
    expect(page.querySelector("header")?.textContent).toMatch(/Picks from Game8, updated .*2026/);
    expect(page.textContent).not.toContain("may not reflect the change");
  });

  it("warns when the game changed the kit after the guide was last updated", () => {
    const page = render({ ...loaded, guide: { ...GUIDE, kitChangedAt: "2026-09-24" } });
    expect(page.querySelector('[role="note"]')?.textContent).toMatch(/Hu Tao's kit changed .* may not reflect the change yet/);
  });

  it("stays quiet when the guide was updated after the kit change", () => {
    const page = render({ ...loaded, guide: { ...GUIDE, kitChangedAt: "2026-09-10" } });
    expect(page.querySelector('[role="note"]')).toBeNull();
  });

  it("shows the guide's own label beside a set rank", () => {
    expect(render(loaded).textContent).toContain("Best-in-Slot");
  });

  it("offers the guide's alternatives for a team slot, linked to their builds", () => {
    const page = render(loaded);
    const group = page.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-label")).toBe("Alternatives to Xingqiu: Xiangling");
    expect(group?.querySelector("a")?.getAttribute("href")).toBe("/genshin/builds/10000023");
  });

  it("opens the Traveler on the element the team names, and says which on the face", () => {
    const teams = [{ name: "Stellar-Swirl Team", members: ["10000046", "10000025"], alternates: [[], ["10000005-cryo"]] }];
    const page = render({ ...loaded, guide: { ...GUIDE, teams } });
    const link = page.querySelector('[role="group"] a');
    expect(link?.getAttribute("href")).toBe("/genshin/builds/10000005-cryo");
    expect(link?.getAttribute("title")).toBe("Traveler (Cryo)");
    // The element's badge sits on the face, the only thing that tells the Travelers apart at this size.
    const icons = [...(link?.querySelectorAll("img") ?? [])].map((img) => img.getAttribute("src"));
    expect(icons).toContain("https://gi.yatta.moe/assets/UI/UI_Buff_Element_Ice.png");
  });

  it("says so when no guide covers the character", () => {
    const page = render({ ...loaded, guide: { ...GUIDE, source: null, weapons: [], teams: [] } });
    expect(page.textContent).toContain("No guide covers Hu Tao yet");
  });
});
