/**
 * Gives every page a search engine should find its own HTML file, then writes
 * sitemap.xml and robots.txt. Runs after `vite build` (see the build script).
 *
 * The host answers any other path with the bare index.html, whose title and
 * description are the home page's: fine for people, since the app retitles
 * the page, but crawlers and link previews read only the HTML. Each copy is
 * the built index.html with that page's title, description and canonical
 * URL; the app takes over as usual once it loads.
 *
 * Showcase pages are left out on purpose: they are other players' profiles,
 * not content, and there is one per UID.
 */
import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve("dist");

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});

let pages;
let siteUrl;
try {
  const load = (file) => vite.ssrLoadModule(file);
  const [{ en }, { format }, site, genshin, hsr, zzz] = await Promise.all([
    load("/src/i18n/locales/en.ts"),
    load("/src/i18n/index.ts"),
    load("/src/legal/site.ts"),
    load("/src/lib/buildTarget/genshin.ts"),
    load("/src/hsr/buildTarget.ts"),
    load("/src/zzz/buildTarget.ts"),
  ]);
  siteUrl = site.SITE_URL;
  const t = (section, key, vars) => format(en[section][key] ?? key, vars);

  const games = [
    {
      prefix: "genshin",
      name: "Genshin Impact",
      // The Genshin layout's title is not in the dictionary; keep in step with src/pages/HomePage.tsx.
      title: "Artifact Aurum - Genshin Impact artifact scorer",
      description:
        "Score your Genshin Impact artifacts from your in-game showcase. Enter a UID to see which pieces are worth leveling, rerolling or replacing.",
      gear: "weapons, artifact sets",
      list: genshin.listGenshinBuilds,
    },
    {
      prefix: "hsr",
      name: "Honkai: Star Rail",
      title: t("hsr", "documentTitle"),
      description:
        "Score your Honkai: Star Rail relics from your in-game showcase. Enter a UID to see how many rolls are working and what to reroll next.",
      gear: "light cones, relic sets",
      list: hsr.listHsrBuilds,
    },
    {
      prefix: "zzz",
      name: "Zenless Zone Zero",
      title: t("zzz", "documentTitle"),
      description:
        "Score your Zenless Zone Zero drive discs from your in-game showcase. Enter a UID to see which discs to keep and which to replace.",
      gear: "W-Engines, drive disc sets",
      list: zzz.listZzzBuilds,
    },
  ];

  pages = [
    { route: site.PRIVACY_PATH.slice(1), title: `Privacy Policy - ${site.SITE_NAME}` },
    { route: site.TERMS_PATH.slice(1), title: `Terms of Use - ${site.SITE_NAME}` },
  ];
  for (const g of games) {
    pages.push({ route: g.prefix, title: g.title, description: g.description });
    pages.push({
      route: `${g.prefix}/builds`,
      title: t("builds", "documentTitle", { game: g.name }),
      description: `${g.name} build guides: best ${g.gear}, main stats and substat priority for every character.`,
    });
    for (const build of g.list(t)) {
      if (build.unlisted) continue;
      pages.push({
        route: `${g.prefix}/builds/${build.id}`,
        title: t("builds", "documentTitleCharacter", { name: build.name, game: g.name }),
        description: `${build.name} build for ${g.name}: best ${g.gear}, main stats and substat priority.`,
      });
    }
  }
} finally {
  await vite.close();
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Swaps one attribute value in the template, failing loudly if index.html changed shape. */
function replace(html, pattern, value) {
  if (!pattern.test(html)) throw new Error(`prerender: index.html no longer matches ${pattern}`);
  return html.replace(pattern, (_, before, after) => `${before}${escape(value)}${after}`);
}

const template = await readFile(path.join(DIST, "index.html"), "utf8");

function render(page, url) {
  let html = template;
  html = replace(html, /(<title>)[^<]*(<\/title>)/, page.title);
  html = replace(html, /(<meta property="og:title" content=")[^"]*(")/, page.title);
  html = replace(html, /(<meta property="og:url" content=")[^"]*(")/, url);
  if (page.description) {
    html = replace(html, /(<meta name="description" content=")[^"]*(")/, page.description);
    html = replace(html, /(<meta property="og:description" content=")[^"]*(")/, page.description);
  }
  return html.replace("</head>", `  <link rel="canonical" href="${escape(url)}" />\n  </head>`);
}

// The root keeps its own title; it only gains a canonical link. Showcase
// pages are served this same file, so they all count as the home page.
await writeFile(path.join(DIST, "index.html"), template.replace("</head>", `  <link rel="canonical" href="${siteUrl}" />\n  </head>`));

const urls = [siteUrl];
for (const page of pages) {
  // The host serves dir/index.html at dir/ (redirecting dir there), so the trailing slash is the real URL.
  const url = `${siteUrl}${page.route}/`;
  const dir = path.join(DIST, page.route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), render(page, url));
  urls.push(url);
}

await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${escape(u)}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
// Crawlers only read robots.txt at a domain's root, so this one takes effect
// once the site has its own domain; until then, submit sitemap.xml in Search Console.
await writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`);

console.log(`prerender: ${pages.length} pages, sitemap with ${urls.length} URLs`);
