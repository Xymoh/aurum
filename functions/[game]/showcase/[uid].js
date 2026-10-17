/**
 * Link previews for showcase pages (Cloudflare Pages Function).
 *
 * A shared showcase link used to preview as the home page: the app renders in
 * the browser, and Discord, X and the rest only read the HTML. For their
 * crawlers this answers the app shell with the player's own title,
 * description and the lead character's splash art as og:image. Everyone else
 * gets the shell untouched, exactly what public/_redirects served before.
 *
 * No image is rendered here: the Workers Free plan allows 10 ms of CPU per
 * request, and drawing a PNG takes far more. The splash art already exists on
 * the art hosts the site uses (enka.network, cdn.jsdelivr.net).
 *
 * Like the relay, it sends Enka only the UID, keeps no log, and caches.
 */
import genshinCharacters from "../../../src/data/characters.json";
import hsrCharacters from "../../../src/hsr/data/characters.json";
import zzzAgents from "../../../src/zzz/data/agents.json";
import { characterPreview } from "../../../src/hsr/images.ts";
import { agentImage } from "../../../src/zzz/images.ts";
import { isValidHsrUid, isValidUid, isValidZzzUid } from "../../../src/lib/uid.ts";

const USER_AGENT = "Aurum/0.1 (+https://aurumgg.com)";
const PREVIEW_BOTS =
  /discordbot|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|redditbot|embedly|skypeuripreview|mastodon|bluesky|cardyb|pinterest|vkshare|iframely/i;

const GAMES = {
  genshin: {
    valid: isValidUid,
    api: (uid) => `https://enka.network/api/uid/${uid}`,
    title: "Artifact Aurum",
    gear: "artifact",
    read: (data) => ({
      nickname: data.playerInfo?.nickname,
      characters: (data.avatarInfoList ?? []).map((a) => {
        const c = genshinCharacters[String(a.avatarId)];
        return {
          name: c?.name,
          image: c?.icon
            ? `https://enka.network/ui/${c.icon.replace("AvatarIcon", "Gacha_AvatarImg")}.png`
            : null,
        };
      }),
    }),
  },
  hsr: {
    valid: isValidHsrUid,
    api: (uid) => `https://enka.network/api/hsr/uid/${uid}`,
    title: "Relic Aurum",
    gear: "relic",
    read: (data) => ({
      nickname: data.detailInfo?.nickname,
      characters: (data.detailInfo?.avatarDetailList ?? []).map((a) => ({
        name: hsrCharacters[String(a.avatarId)]?.name,
        image: characterPreview(a.avatarId),
      })),
    }),
  },
  zzz: {
    valid: isValidZzzUid,
    api: (uid) => `https://enka.network/api/zzz/uid/${uid}`,
    title: "Disc Aurum",
    gear: "drive disc",
    read: (data) => ({
      nickname: data.PlayerInfo?.SocialDetail?.ProfileDetail?.Nickname,
      characters: (data.PlayerInfo?.ShowcaseDetail?.AvatarList ?? []).map((a) => ({
        name: zzzAgents[String(a.Id)]?.name,
        image: agentImage(a.Id),
      })),
    }),
  },
};

/** The app shell every showcase is served, from the root page. */
const shell = (env, request) => env.ASSETS.fetch(new URL("/", request.url));

export async function onRequestGet({ request, env, params }) {
  const game = GAMES[params.game];
  // Not one of the three games: let the host answer, which is its 404 page.
  if (!game) return env.ASSETS.fetch(request);
  if (!PREVIEW_BOTS.test(request.headers.get("User-Agent") ?? "") || !game.valid(params.uid)) {
    return shell(env, request);
  }

  let player;
  try {
    const upstream = await fetch(game.api(params.uid), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": 60, "300-599": -1 } },
    });
    if (!upstream.ok) return shell(env, request);
    player = game.read(await upstream.json());
  } catch {
    return shell(env, request);
  }

  const names = player.characters.map((c) => c.name).filter(Boolean);
  const image = player.characters.find((c) => c.image)?.image;
  if (!player.nickname || names.length === 0) return shell(env, request);

  const title = `${player.nickname} (${params.uid}) - ${game.title}`;
  const shown = names.slice(0, 4).join(", ") + (names.length > 4 ? " and more" : "");
  const description = `${names.length} on display: ${shown}. See how every ${game.gear} scores, and what to reroll next.`;
  const set = (value) => ({ element: (el) => el.setAttribute("content", value) });

  const response = new HTMLRewriter()
    .on("title", { element: (el) => el.setInnerContent(title) })
    .on('meta[property="og:title"]', set(title))
    .on('meta[name="description"]', set(description))
    .on('meta[property="og:description"]', set(description))
    .on('meta[property="og:url"]', set(request.url))
    .on('meta[property="og:image"]', set(image ?? "https://aurumgg.com/og.png"))
    // The size tags describe og.png; the splash art is a different shape.
    .on('meta[property="og:image:width"], meta[property="og:image:height"]', {
      element: (el) => (image ? el.remove() : undefined),
    })
    .transform(await shell(env, request));
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=300");
  return new Response(response.body, { status: 200, headers });
}
