import { useEffect, useState } from "react";
import { useI18n } from "../../i18n";
import { scrollBehavior } from "../../lib/motion";
import type { BuildSkin } from "./skin";

export interface NavItem {
  /** The section element's id. */
  id: string;
  label: string;
}

/**
 * The build page's table of contents, pinned under the site header.
 *
 * A full guide runs to several screens, and the question someone arrives
 * with is usually one of them ("which weapon?", "what do I farm?"). The
 * pill for the section in view is highlighted, so the bar doubles as a
 * "you are here".
 */
export function SectionNav({ items, skin }: { items: NavItem[]; skin: BuildSkin }) {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const order = ids.split(",");
    const inView = new Set<string>();
    // A section counts as current while its top half is in the band under
    // the two sticky bars; the first such section in page order wins.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target.id);
          else inView.delete(entry.target.id);
        }
        const first = order.find((id) => inView.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label={t("guide", "navLabel")}
      className={`sticky top-14 z-20 rounded-lg border px-2 py-1.5 backdrop-blur-md ${skin.bar}`}
    >
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setActive(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
              }}
              aria-current={active === item.id ? "location" : undefined}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active === item.id ? skin.active : `border-transparent ${skin.muted} hover:opacity-80`
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
