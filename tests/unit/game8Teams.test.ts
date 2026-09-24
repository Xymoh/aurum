import { describe, expect, it } from "vitest";
import { parseGame8Teams, teamLabel } from "../../scripts/fetch-genshin-sets.mjs";

/** Game8's markup, reduced to what the reader looks at. */
const heading = (text: string) => `<h3 class='a-header--3'>${text}</h3>`;
const slot = (...names: string[]) => `<td>${names.map((n) => `<a class='a-link' href=/games/x>${n}</a>`).join(" <hr> ")}</td>`;
const table = (title: string | null, ...teams: string[][]) =>
  `<table class='a-table'>${title ? `<tr><th colspan="4">${title}</th></tr>` : ""}${teams
    .map((team) => `<tr>${team.map((name) => slot(name)).join("")}</tr>`)
    .join("")}</table>`;
const names = (html: string) => parseGame8Teams({ title: "Best Team Comps", html }).map((t) => t.name);

describe("Game8 team titles", () => {
  it("come from the heading a table sits under, not a title cell copied from another table", () => {
    // Mizuki's page as of September 2026: the Lunar-Charged table kept the
    // Stellar-Swirl table's title cell.
    const html =
      heading("Stellar-Swirl Teams") +
      table("Mizuki's Best Stellar-Swirl Team", ["Mizuki", "Odette", "Diona", "Sucrose"]) +
      heading("Lunar-Charged Teams") +
      table("Mizuki's Best Stellar-Swirl Team", ["Mizuki", "Columbina", "Ineffa", "Sucrose"]);
    expect(names(html)).toEqual(["Stellar-Swirl Teams", "Lunar-Charged Teams"]);
  });

  it("come from the title cells where one heading covers tables they tell apart", () => {
    const html = heading("Best Teams") + table("Vaporize Team", ["Hu Tao", "Xingqiu", "Yelan", "Zhongli"]) + table("Melt Team", ["Hu Tao", "Rosaria", "Kaeya", "Zhongli"]);
    expect(names(html)).toEqual(["Vaporize Team", "Melt Team"]);
  });

  it("come from the title cell where there is no heading", () => {
    expect(names(table("Hypercarry Team", ["Varesa", "Iansan", "Xianyun", "Chevreuse"]))).toEqual(["Hypercarry Team"]);
  });

  it("name every row of a table, and keep each slot's alternates after its pick", () => {
    const html =
      heading("Hu Tao Vaporize Teams") +
      `<table class='a-table'><tr>${slot("Hu Tao")}${slot("Xingqiu", "Yelan")}${slot("Zhongli")}${slot("Furina")}</tr><tr>${slot("Hu Tao")}${slot("Yelan")}${slot("Xilonen")}${slot("Furina")}</tr></table>`;
    const teams = parseGame8Teams({ title: "Best Team Comps", html });
    expect(teams.map((t) => t.name)).toEqual(["Hu Tao Vaporize Teams", "Hu Tao Vaporize Teams"]);
    expect(teams[0].members[1]).toEqual(["Xingqiu", "Yelan"]);
  });
});

describe("teamLabel", () => {
  it("drops the character's own name from the front, possessive or not, and names one team", () => {
    expect(teamLabel("Hu Tao Vaporize Teams", ["Hu Tao", "Hu", "Tao"])).toBe("Vaporize Team");
    expect(teamLabel("Mizuki's Best Stellar-Swirl Team", ["Yumemizuki Mizuki", "Mizuki"])).toBe("Best Stellar-Swirl Team");
    expect(teamLabel("Ayaka F2P Team Comps", ["Ayaka"])).toBe("F2P Team Comp");
  });

  it("keeps the name where it is part of the title rather than in front of it", () => {
    expect(teamLabel("Jean - Furina Team Comp", ["Jean"])).toBe("Jean - Furina Team Comp");
    expect(teamLabel("Kirara in Bloom Teams", ["Kirara"])).toBe("Kirara in Bloom Team");
    expect(teamLabel("Xiangling-Bennett Duo Teams", ["Xiangling"])).toBe("Xiangling-Bennett Duo Team");
    // Without the name, nothing would be left to read.
    expect(teamLabel("Nicole Teams", ["Nicole"])).toBe("Nicole Team");
  });

  it("leaves a missing title missing", () => {
    expect(teamLabel(null, ["Hu Tao"])).toBeNull();
  });
});
