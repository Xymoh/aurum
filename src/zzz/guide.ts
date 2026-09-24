/** Where Zenless's guide files live; see lib/buildTarget/guideSource.ts. */

import type { GuideFile, SetBonusFile } from "../lib/buildTarget/guide";
import { guideSource } from "../lib/buildTarget/guideSource";

export const ZZZ_GUIDES = guideSource(
  "zzz",
  import.meta.glob<GuideFile>("./data/guides/*.json", { import: "default" }),
  import.meta.glob<SetBonusFile>("./data/set-bonuses.json", { import: "default" }),
);
