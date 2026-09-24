import { useI18n } from "../../i18n";
import type { MaterialGroup } from "../../lib/buildTarget/guide";
import type { ShareGame } from "../../lib/shareCard/model";
import { RemoteImg } from "../ui/RemoteImg";
import { rarityTone } from "./rarity";
import { SubHeading } from "./Section";
import type { BuildSkin } from "./skin";

/** Where ascension ends in each game. */
const MAX_LEVEL: Record<ShareGame, number> = { genshin: 90, hsr: 80, zzz: 60 };

/**
 * Farming totals, one block per thing to finish. Totals rather than a
 * per-step table: the question is "how many do I need", and the game
 * itself shows the per-step cost at the point of spending it.
 */
export function MaterialList({ groups, game, skin }: { groups: MaterialGroup[]; game: ShareGame; skin: BuildSkin }) {
  const { t, lang } = useI18n();

  const title = (group: MaterialGroup): string => {
    switch (group.id) {
      case "ascension":
        return t("guide", "matAscension", { max: MAX_LEVEL[game] });
      case "talents":
        return t("guide", "matTalents");
      case "traces":
        return t("guide", "matTraces");
      case "skills":
        return t("guide", "matSkills");
      case "core":
        return t("guide", "matCore");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.id}>
          <SubHeading skin={skin}>{title(group)}</SubHeading>
          <ul className="grid grid-cols-1 gap-1.5">
            {group.items.map((item) => (
              <li key={item.id} className={`game-panel-sm flex items-center gap-2.5 border px-2 py-1.5 ${skin.card}`}>
                {/* An item can come without an icon (one the last build could
                    not fetch); the rarity still shows then, as a strip rather
                    than an empty tile that reads as a broken image. */}
                <span
                  className={`shrink-0 overflow-hidden rounded ${item.iconUrl ? "h-9 w-9" : "h-7 w-1.5"}`}
                  style={{ background: rarityTone(game, item.rarity) }}
                >
                  {item.iconUrl && (
                    <RemoteImg src={item.iconUrl} alt="" loading="lazy" width={36} height={36} className="h-full w-full object-contain" />
                  )}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${skin.text}`} title={item.name}>
                  {item.name}
                </span>
                <span className={`shrink-0 font-mono text-sm tabular-nums ${skin.accent}`}>
                  ×{item.count.toLocaleString(lang)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
