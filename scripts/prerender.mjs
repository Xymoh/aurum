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
 * not content, and there is one per UID. public/_redirects serves them the
 * root page instead, because the 404.html written here turns off the host's
 * fallback: every other path without a file answers 404. So every route the
 * app serves must have a file here, indexed or not (`noindex`).
 */
import { createServer } from "vite";
import { createHash } from "node:crypto";
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
let siteName;
try {
  const load = (file) => vite.ssrLoadModule(file);
  const [{ en }, { format }, site, genshin, hsr, zzz, help] = await Promise.all([
    load("/src/i18n/locales/en.ts"),
    load("/src/i18n/index.ts"),
    load("/src/legal/site.ts"),
    load("/src/lib/buildTarget/genshin.ts"),
    load("/src/hsr/buildTarget.ts"),
    load("/src/zzz/buildTarget.ts"),
    load("/src/help/content.ts"),
  ]);
  siteUrl = site.SITE_URL;
  siteName = site.SITE_NAME;
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
    { route: site.PRIVACY_PATH.slice(1, -1), title: `Privacy Policy - ${site.SITE_NAME}` },
    { route: site.TERMS_PATH.slice(1, -1), title: `Terms of Use - ${site.SITE_NAME}` },
  ];
  for (const g of games) {
    pages.push({ route: g.prefix, title: g.title, description: g.description });
    pages.push({
      route: `${g.prefix}/builds`,
      title: t("builds", "documentTitle", { game: g.name }),
      description: `${g.name} build guides: best ${g.gear}, main stats and substat priority for every character.`,
    });
    for (const build of g.list(t)) {
      pages.push({
        route: `${g.prefix}/builds/${build.id}`,
        title: t("builds", "documentTitleCharacter", { name: build.name, game: g.name }),
        description: `${build.name} build for ${g.name}: best ${g.gear}, main stats and substat priority.`,
        // The other Traveler/Trailblazer body: linked from team lists, kept out of search.
        noindex: Boolean(build.unlisted),
      });
    }
    if (help.SHOWCASE_HELP) {
      pages.push({
        route: help.HELP_PATH[g.prefix].slice(1, -1),
        // Keep in step with src/help/ShowcaseHelpPage.tsx.
        title: `${t("help", "title")} - ${g.name} - ${site.SITE_NAME}`,
        description: `How to put your characters on your ${g.name} showcase so a UID lookup can read them, step by step with screenshots.`,
      });
    }
  }
} finally {
  await vite.close();
}

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Swaps one attribute value in the template, failing loudly if index.html changed shape. */
function replace(html, pattern, value) {
  if (!pattern.test(html)) throw new Error(`prerender: index.html no longer matches ${pattern}`);
  return html.replace(pattern, (_, before, after) => `${before}${escape(value)}${after}`);
}

const template = await readFile(path.join(DIST, "index.html"), "utf8");

// public/_headers pins index.html's inline script by hash and names the Enka
// relay in connect-src. Fail the build rather than ship a page the policy blocks.
const headersFile = await readFile(path.join(DIST, "_headers"), "utf8");
for (const [, body] of template.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const hash = `'sha256-${createHash("sha256").update(body).digest("base64")}'`;
  if (!headersFile.includes(hash)) {
    throw new Error(
      `prerender: index.html's inline script changed; put ${hash} in script-src in public/_headers`,
    );
  }
}
if (process.env.VITE_ENKA_PROXY) {
  const relay = new URL(process.env.VITE_ENKA_PROXY.replace(/\{(uid|url)\}/g, "")).origin;
  if (!headersFile.includes(relay)) {
    throw new Error(`prerender: add ${relay} (VITE_ENKA_PROXY) to connect-src in public/_headers`);
  }
}

function render(page, url) {
  let html = template;
  html = replace(html, /(<title>)[^<]*(<\/title>)/, page.title);
  html = replace(html, /(<meta property="og:title" content=")[^"]*(")/, page.title);
  html = replace(html, /(<meta property="og:url" content=")[^"]*(")/, url);
  if (page.description) {
    html = replace(html, /(<meta name="description" content=")[^"]*(")/, page.description);
    html = replace(html, /(<meta property="og:description" content=")[^"]*(")/, page.description);
  }
  const tail = page.noindex
    ? `  <meta name="robots" content="noindex" />\n  </head>`
    : `  <link rel="canonical" href="${escape(url)}" />\n  </head>`;
  return html.replace("</head>", tail);
}

// The root keeps its own title; it only gains a canonical link. Showcase
// pages are served this same file, so they all count as the home page.
await writeFile(
  path.join(DIST, "index.html"),
  template.replace("</head>", `  <link rel="canonical" href="${siteUrl}" />\n  </head>`),
);

const urls = [siteUrl];
for (const page of pages) {
  // The host serves dir/index.html at dir/ (redirecting dir there), so the trailing slash is the real URL.
  const url = `${siteUrl}${page.route}/`;
  const dir = path.join(DIST, page.route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), render(page, url));
  if (!page.noindex) urls.push(url);
}

// Its presence makes the host answer 404 for any path without a file. The app
// still loads in it and shows its own not-found page.
await writeFile(
  path.join(DIST, "404.html"),
  render({ title: `Page not found - ${siteName}`, noindex: true }, `${siteUrl}404`),
);

await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${escape(u)}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
// Crawlers only read robots.txt at a domain's root, which this is now that the site has its own domain.
await writeFile(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
);

console.log(`prerender: ${pages.length} pages and 404.html, sitemap with ${urls.length} URLs`);
