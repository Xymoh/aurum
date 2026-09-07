/**
 * Draws a shareable character card onto a canvas and hands back a PNG.
 *
 * Hand-drawn rather than screenshotted from the DOM. The panels lean on
 * clip-path notches, backdrop-filter and colour-mix, and every DOM-to-image
 * library reproduces at most one of those - the output came back with square
 * corners and grey washes where the blur should be. Drawing the card as its
 * own composition also lets it be laid out for the place it ends up, a 16:9
 * embed in a chat client, rather than for a page column.
 *
 * Every remote host involved (enka.network, jsDelivr) sends
 * `access-control-allow-origin: *`, so the images load as `anonymous` and
 * leave the canvas untainted. A host that ever stops doing that would taint
 * it and make toBlob throw, so image loads resolve to null instead of
 * rejecting and the card simply renders without that picture.
 */

import type { ShareCardModel, SharePiece } from "./model";
import { CARD_THEME, gradeHex } from "./theme";

/** Card size in CSS pixels; 16:9 so chat clients embed it without cropping. */
const W = 1200;
const H = 675;
/** Drawn at 2x so the text survives a retina screen and Discord's resize. */
const SCALE = 2;

const PAD = 36;
const ART_W = 430;
const COL_X = 466;
const COL_R = W - PAD;

const SANS = `"Inter", ui-sans-serif, system-ui, "Segoe UI", "Noto Sans SC", sans-serif`;
const MONO = `"JetBrains Mono", ui-monospace, "Cascadia Mono", monospace`;

type Ctx = CanvasRenderingContext2D;

// ── Small drawing helpers ───────────────────────────────────────────

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Trims to fit, with an ellipsis, so a long name cannot run into the score. */
function fit(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}...`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

/**
 * `object-fit: cover` with `object-position`, matching what the panels do in
 * CSS so the adapters' focus values mean the same thing here as there.
 */
function drawCover(
  ctx: Ctx,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  focus: { x: number; y: number },
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - sw) * focus.x, y + (h - sh) * focus.y, sw, sh);
  ctx.restore();
}

/** `object-fit: contain`, for icons that must not be cropped. */
function drawContain(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

/**
 * Never rejects. A missing portrait should cost the card a picture, not the
 * whole render, and one 404 in a six-piece strip should not lose the strip.
 */
function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function chip(ctx: Ctx, text: string, x: number, y: number, fg: string, border: string): number {
  ctx.font = `600 15px ${SANS}`;
  const w = ctx.measureText(text).width + 20;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, 26, 6);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 10, y + 14);
  ctx.textBaseline = "alphabetic";
  return w;
}

// ── The card ────────────────────────────────────────────────────────

export async function renderShareCard(model: ShareCardModel): Promise<Blob> {
  const theme = CARD_THEME[model.game];

  // Text is measured before it is drawn, so the fonts have to be resolved
  // first or every width is computed against the fallback face.
  if (document.fonts?.ready) await document.fonts.ready;

  const [portrait, gearIcon, pieceIcons] = await Promise.all([
    loadImage(model.portraitUrl),
    loadImage(model.gear?.iconUrl ?? null),
    Promise.all(model.pieces.map((p) => loadImage(p.iconUrl))),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable in this browser");
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  drawArt(ctx, portrait, model, theme.bg);
  drawIdentity(ctx, model, theme);
  drawScore(ctx, model, theme);
  drawGear(ctx, model, theme, gearIcon);
  drawStats(ctx, model, theme);
  drawPieces(ctx, model, theme, pieceIcons);
  drawFooter(ctx, model, theme);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Card could not be encoded"))),
      "image/png",
    );
  });
}

function drawArt(ctx: Ctx, portrait: HTMLImageElement | null, model: ShareCardModel, bg: string) {
  if (portrait) {
    drawCover(ctx, portrait, 0, 0, ART_W, H, model.portraitFocus);
  }

  // Wash the art into the background rather than leaving a hard edge, the
  // same mask the panels use. Drawn even without a portrait so the left
  // column keeps its tint.
  const fade = ctx.createLinearGradient(ART_W * 0.45, 0, ART_W, 0);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, bg);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, ART_W, H);

  // A tint of the character's own colour, so the card reads as theirs.
  ctx.save();
  ctx.globalAlpha = 0.14;
  const glow = ctx.createLinearGradient(0, H, ART_W, 0);
  glow.addColorStop(0, model.accent);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_W, H);
  ctx.restore();
}

function drawIdentity(ctx: Ctx, model: ShareCardModel, theme: typeof CARD_THEME.genshin) {
  ctx.font = `800 44px ${SANS}`;
  ctx.fillStyle = theme.text;
  // Stops short of the score block, which is right-aligned from COL_R.
  ctx.fillText(fit(ctx, model.name, 480), COL_X, 92);

  ctx.fillStyle = model.accent;
  roundRect(ctx, COL_X, 108, 64, 4, 2);
  ctx.fill();

  let x = COL_X;
  for (const text of [model.level, model.rank, ...model.tags]) {
    x += chip(ctx, text, x, 134, theme.muted, theme.border) + 8;
  }
}

function drawScore(ctx: Ctx, model: ShareCardModel, theme: typeof CARD_THEME.genshin) {
  ctx.textAlign = "right";

  if (model.score.complete) {
    const color = gradeHex(model.score.grade, theme.muted);
    ctx.font = `800 62px ${MONO}`;
    ctx.fillStyle = color;
    ctx.fillText(model.score.value.toFixed(1), COL_R, 92);

    ctx.font = `800 22px ${SANS}`;
    const gw = ctx.measureText(model.score.grade).width + 22;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = color;
    roundRect(ctx, COL_R - gw, 108, gw, 30, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(model.score.grade, COL_R - 11, 124);
    ctx.textBaseline = "alphabetic";
  } else {
    // An unfinished build has no meaningful score, so the slot count takes
    // the number's place rather than a total that reads as a bad build.
    ctx.font = `800 62px ${MONO}`;
    ctx.fillStyle = theme.muted;
    ctx.fillText("-", COL_R, 92);
    ctx.font = `600 16px ${SANS}`;
    ctx.fillText(model.score.note, COL_R, 126);
  }

  ctx.font = `500 14px ${MONO}`;
  ctx.fillStyle = theme.muted;
  ctx.fillText(model.footnote, COL_R, 156);
  ctx.textAlign = "left";
}

function drawGear(
  ctx: Ctx,
  model: ShareCardModel,
  theme: typeof CARD_THEME.genshin,
  icon: HTMLImageElement | null,
) {
  if (!model.gear) return;
  const y = 186;

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  roundRect(ctx, COL_X, y, 46, 46, 8);
  ctx.stroke();
  if (icon) {
    ctx.save();
    roundRect(ctx, COL_X + 1, y + 1, 44, 44, 7);
    ctx.clip();
    drawContain(ctx, icon, COL_X + 1, y + 1, 44, 44);
    ctx.restore();
  }

  ctx.font = `600 20px ${SANS}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(fit(ctx, model.gear.name, 480), COL_X + 60, y + 21);

  ctx.font = `700 16px ${MONO}`;
  ctx.fillStyle = model.accent;
  ctx.fillText(model.gear.refine, COL_X + 60, y + 42);
}

function drawStats(ctx: Ctx, model: ShareCardModel, theme: typeof CARD_THEME.genshin) {
  const top = 268;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(COL_X, top - 22);
  ctx.lineTo(COL_R, top - 22);
  ctx.stroke();

  // Two columns. Eight is what fits; the adapters put the stats that decide
  // a build (crit, the character's own damage bonus) at the front of the
  // list, so the overflow is always the least interesting tail.
  const shown = model.stats.slice(0, 8);
  const colW = (COL_R - COL_X) / 2;
  const rowH = 38;

  shown.forEach((stat, i) => {
    const x = COL_X + (i % 2) * colW;
    const y = top + Math.floor(i / 2) * rowH;

    ctx.font = `500 17px ${SANS}`;
    ctx.fillStyle = theme.muted;
    ctx.fillText(fit(ctx, stat.label, colW - 130), x, y);

    ctx.font = `700 18px ${MONO}`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = "right";
    ctx.fillText(stat.value, x + colW - 24, y);
    ctx.textAlign = "left";
  });
}

function drawPieces(
  ctx: Ctx,
  model: ShareCardModel,
  theme: typeof CARD_THEME.genshin,
  icons: (HTMLImageElement | null)[],
) {
  const pieces = model.pieces;
  if (pieces.length === 0) return;

  const top = 470;
  const h = 132;
  const gap = 12;
  const total = COL_R - COL_X;
  const w = (total - gap * (pieces.length - 1)) / pieces.length;

  pieces.forEach((piece, i) => {
    drawPiece(ctx, piece, icons[i], COL_X + i * (w + gap), top, w, h, theme);
  });
}

function drawPiece(
  ctx: Ctx,
  piece: SharePiece,
  icon: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: typeof CARD_THEME.genshin,
) {
  const color = gradeHex(piece.grade, theme.muted);

  ctx.fillStyle = theme.panel;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();

  // A grade-coloured cap, so the strip can be read at a glance without
  // anyone having to parse six numbers.
  ctx.fillStyle = color;
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillRect(x, y, w, 3);
  ctx.restore();

  if (icon) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    drawContain(ctx, icon, x + w / 2 - 26, y + 14, 52, 52);
    ctx.restore();
  }

  ctx.textAlign = "center";
  const mid = x + w / 2;

  ctx.font = `500 13px ${SANS}`;
  ctx.fillStyle = theme.muted;
  ctx.fillText(fit(ctx, piece.slot, w - 12), mid, y + 84);

  ctx.font = `800 24px ${MONO}`;
  ctx.fillStyle = color;
  ctx.fillText(piece.score.toFixed(0), mid, y + 112);

  ctx.textAlign = "left";
}

function drawFooter(ctx: Ctx, model: ShareCardModel, theme: typeof CARD_THEME.genshin) {
  const y = 640;

  ctx.font = `600 15px ${SANS}`;
  ctx.fillStyle = theme.muted;
  ctx.fillText(`${model.playerName}  ·  UID ${model.uid}`, COL_X, y);

  ctx.textAlign = "right";
  ctx.font = `700 15px ${SANS}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText(theme.wordmark, COL_R, y);
  ctx.textAlign = "left";
}

/** Filename for the download, safe on every platform. */
export function shareCardFilename(model: ShareCardModel): string {
  const slug = model.name.replace(/[^\w一-鿿-]+/g, "-").replace(/^-|-$/g, "");
  return `aurum-${model.game}-${slug || model.uid}.png`;
}
