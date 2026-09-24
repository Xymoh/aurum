/** Where Genshin's guide files live; see guideSource.ts for why this is a glob. */

import type { GuideFile, SetBonusFile } from "./guide";
import { guideSource } from "./guideSource";

export const GENSHIN_GUIDES = guideSource(
  "genshin",
  import.meta.glob<GuideFile>("../../data/guides/*.json", { import: "default" }),
  import.meta.glob<SetBonusFile>("../../data/set-bonuses.json", { import: "default" }),
);
