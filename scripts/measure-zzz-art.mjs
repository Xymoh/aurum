/**
 * measure-zzz-art.mjs
 * ──────────────────────────────────────────────────────────────────
 * Finds where each Zenless agent's face sits in their full-body render and
 * writes it to src/zzz/data/art-focus.json, as fractions of the image.
 *
 * Why: the agent panel shows the render as a wide, short banner cropped
 * near the top of the image, and the renders are not framed consistently.
 * Most agents' heads start a few percent from the top; Claret's scythe
 * pole reaches the top edge with her head well below it, so the crop that
 * frames everyone else lands on her forehead and cuts her face off at the
 * banner's bottom edge. Sideways, she leans right and Sigrid leans left.
 * The panel positions each render by the values stored here.
 *
 * The head is found as the first row wide enough to be a head rather than
 * a weapon tip (over 12% of the image width opaque); the face centre is
 * taken a fixed distance below it, and its x as the centre of mass of the
 * head band. Verified by eye on a spread of renders; see the file history.
 *
 * Only agents with no value yet are measured, so a re-run after a patch
 * downloads the new renders and nothing else (each is 2 to 3 MB).
 *
 * Usage: node scripts/measure-zzz-art.mjs          (new agents only)
 *        node scripts/measure-zzz-art.mjs --all    (re-measure everyone)
 * ──────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AGENTS = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "zzz", "data", "agents.json"), "utf8"));
const OUTPUT = path.join(ROOT, "src", "zzz", "data", "art-focus.json");
const CDN = "https://enka.network";
const ALL = process.argv.includes("--all");

/** Alpha above this counts as part of the character rather than antialiasing. */
const OPAQUE = 40;
/** Sampling stride; the renders are ~2000px wide and the answer is a percentage. */
const STEP = 4;
/** A row this wide (share of image width) is a head, not a weapon tip or a hair strand. */
const HEAD_MIN_WIDTH = 0.12;
/** A head is roughly this share of a full-body render; the face centre sits about 70% down it. */
const HEAD_HEIGHT = 0.13;
const FACE_DOWN_HEAD = 0.7;

async function fetchPng(url) {
  const res = await fetch(url, { headers: { "User-Agent": "aurum-fetcher/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return PNG.sync.read(Buffer.from(await res.arrayBuffer()));
}

/**
 * Face position as fractions of the image: { x, y }.
 *
 * Scans down for the first row with a wide opaque run, which is the top of
 * the head; thin things above it (Claret's scythe, hair ornaments) are
 * skipped. The face centre is a fixed way down from there, and its x is the
 * centre of mass of the head band.
 */
function facePosition(png) {
  const { width, height, data } = png;
  const opaque = (x, y) => data[(y * width + x) * 4 + 3] > OPAQUE;

  let headTop = -1;
  for (let y = 0; y < height / 2 && headTop < 0; y += STEP) {
    let n = 0;
    for (let x = 0; x < width; x += STEP) if (opaque(x, y)) n++;
    if (n * STEP > width * HEAD_MIN_WIDTH) headTop = y;
  }
  if (headTop < 0) return { x: 0.5, y: 0.15 };

  const bandEnd = Math.min(height, headTop + height * HEAD_HEIGHT);
  let sum = 0;
  let count = 0;
  for (let y = headTop; y < bandEnd; y += STEP) {
    for (let x = 0; x < width; x += STEP) {
      if (opaque(x, y)) {
        sum += x;
        count++;
      }
    }
  }
  return {
    x: count ? sum / count / width : 0.5,
    y: (headTop + height * HEAD_HEIGHT * FACE_DOWN_HEAD) / height,
  };
}

async function main() {
  const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")).agents ?? {} : {};
  const focus = ALL ? {} : { ...existing };
  const todo = Object.entries(AGENTS).filter(([id, a]) => a.image && !(id in focus));
  console.log(`${todo.length} render${todo.length === 1 ? "" : "s"} to measure${ALL ? "" : " (pass --all to redo everyone)"}`);

  for (const [id, a] of todo) {
    process.stdout.write(`  ${a.name.padEnd(20)} `);
    try {
      const { x, y } = facePosition(await fetchPng(CDN + a.image));
      focus[id] = { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
      const notes = [];
      if (Math.abs(x - 0.5) > 0.12) notes.push("off-centre");
      if (y > 0.19) notes.push("low face");
      console.log(`x ${(x * 100).toFixed(0)}%  y ${(y * 100).toFixed(0)}%${notes.length ? "  (" + notes.join(", ") + ")" : ""}`);
    } catch (err) {
      console.log(`skipped: ${err.message}`);
    }
  }

  // Drop agents Enka no longer lists, so the file cannot grow stale ids.
  for (const id of Object.keys(focus)) if (!AGENTS[id]) delete focus[id];

  const output = {
    note: "Face position in each agent's full-body render, as fractions of image width and height. Generated by scripts/measure-zzz-art.mjs; the panel positions the art so every face lands in the same place.",
    agents: Object.fromEntries(Object.entries(focus).sort(([a], [b]) => Number(a) - Number(b))),
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`  ✔ wrote ${Object.keys(focus).length} agents to ${path.relative(ROOT, OUTPUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
