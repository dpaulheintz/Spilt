#!/usr/bin/env node
/**
 * Spilt Social dither pipeline — cobalt-on-cream ordered-dither duotone.
 *
 * Usage:
 *   npm run dither                    # Bayer 8x8, scale 4, cobalt/cream
 *   npm run dither -- --scale 3      # dot chunkiness (2|3|4)
 *   npm run dither -- --fs           # Floyd–Steinberg error diffusion
 *   npm run dither -- --color        # teal #2A6B8A variant
 *   npm run dither -- --posterize 3  # 3 zones: cream / 50% dither / cobalt
 *   npm run dither:test              # contact sheet at scales 2/3/4
 *
 * Pre-pass (the part that makes it read as a photograph): gaussian blur
 * (sigma 1) → percentile contrast stretch (clip 2% shadows/highlights)
 * → smoothstep S-curve. Real blacks and real whites BEFORE the Bayer
 * pass — mushy midtones read as noise.
 *
 * Input:  every image in assets-raw/  (jpg/jpeg/png/webp)
 * Output: public/assets/dither/<name>.png
 *
 * The four standard scene names the /dither page uses (hero, fig-01,
 * fig-02, band) are generated procedurally through the same pipeline
 * whenever no raw file claims the name — the page never breaks.
 */

import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAW_DIR = "assets-raw";
const OUT_DIR = "public/assets/dither";

const COBALT = { r: 0x16, g: 0x27, b: 0x6b }; // #16276B
const TEAL = { r: 0x2a, g: 0x6b, b: 0x8a }; // #2A6B8A
const CREAM = { r: 0xf5, g: 0xe1, b: 0xc4 }; // #F5E1C4

/* ── flags ─────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const useFS = argv.includes("--fs");
const useTeal = argv.includes("--color");
const testMode = argv.includes("--test");
const scaleIdx = argv.indexOf("--scale");
const SCALE = scaleIdx >= 0 ? Math.max(1, parseInt(argv[scaleIdx + 1], 10) || 4) : 4;
const posterIdx = argv.indexOf("--posterize");
const POSTERIZE = posterIdx >= 0 ? parseInt(argv[posterIdx + 1], 10) || 3 : 0;
const DARK = useTeal ? TEAL : COBALT;

/* ── 8x8 Bayer matrix ──────────────────────────────────────── */
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function put(out, i, c) {
  out[i * 3] = c.r;
  out[i * 3 + 1] = c.g;
  out[i * 3 + 2] = c.b;
}

function ditherBayer(gray, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (POSTERIZE === 3) {
        // three zones: solid cobalt / 50% ordered dither / solid cream
        const g = gray[i];
        if (g < 85) put(out, i, DARK);
        else if (g > 170) put(out, i, CREAM);
        else put(out, i, BAYER8[y % 8][x % 8] < 32 ? DARK : CREAM);
      } else {
        const t = ((BAYER8[y % 8][x % 8] + 0.5) / 64) * 255;
        put(out, i, gray[i] < t ? DARK : CREAM);
      }
    }
  }
  return out;
}

function ditherFloydSteinberg(gray, w, h) {
  const buf = Float32Array.from(gray);
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const isDark = old < 128;
      const err = old - (isDark ? 0 : 255);
      put(out, i, isDark ? DARK : CREAM);
      if (x + 1 < w) buf[i + 1] += (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) buf[i + w - 1] += (err * 3) / 16;
        buf[i + w] += (err * 5) / 16;
        if (x + 1 < w) buf[i + w + 1] += (err * 1) / 16;
      }
    }
  }
  return out;
}

/* smoothstep S-curve: pushes midtones toward black/white */
function sCurve(gray) {
  for (let i = 0; i < gray.length; i++) {
    const t = gray[i] / 255;
    gray[i] = Math.round(255 * t * t * (3 - 2 * t));
  }
  return gray;
}

/* ── pipeline: input → dithered PNG buffer ─────────────────── */
async function computeDithered(input, scale) {
  // pre-pass: blur → grayscale → 2%/98% percentile stretch
  const meta = await sharp(input)
    .rotate()
    .resize(1600, null, { withoutEnlargement: true, fit: "inside" })
    .blur(1)
    .grayscale()
    .normalise({ lower: 2, upper: 98 })
    .toBuffer({ resolveWithObject: true });

  const smallW = Math.max(8, Math.round(meta.info.width / scale));
  const smallH = Math.max(8, Math.round(meta.info.height / scale));
  const { data } = await sharp(meta.data)
    .resize(smallW, smallH, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const gray = sCurve(Uint8ClampedArray.from(data));
  const rgb = useFS
    ? ditherFloydSteinberg(gray, smallW, smallH)
    : ditherBayer(gray, smallW, smallH);

  const png = await sharp(rgb, {
    raw: { width: smallW, height: smallH, channels: 3 },
  })
    .resize(smallW * scale, smallH * scale, { kernel: "nearest" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  return { png, w: smallW * scale, h: smallH * scale };
}

async function processImage(input, outName, scale = SCALE) {
  const { png, w, h } = await computeDithered(input, scale);
  await sharp(png).toFile(path.join(OUT_DIR, `${outName}.png`));
  console.log(
    `  ✓ ${outName}.png  (${w}x${h}, scale ${scale}, ${
      useFS ? "floyd-steinberg" : "bayer8"
    }${POSTERIZE ? `, posterize ${POSTERIZE}` : ""}${useTeal ? ", teal" : ""})`
  );
}

/* ── procedural placeholder scenes (SVG → pipeline) ────────── */
function svgScene(kind) {
  const W = 1600;
  const H = kind === "band" ? 500 : 1000;
  let inner = "";
  const rand = (() => {
    let s = 20260916;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  if (kind === "hero") {
    let bodies = "";
    for (let i = 0; i < 60; i++) {
      const x = rand() * W;
      const yBase = 690 + rand() * 260;
      const s = 0.8 + rand() * 1.5;
      const g = 210 - (yBase - 690) * 0.55;
      bodies += `<g transform="translate(${x},${yBase}) scale(${s})" fill="rgb(${g | 0},${g | 0},${g | 0})">
        <circle cx="0" cy="-88" r="26"/><rect x="-34" y="-62" width="68" height="120" rx="20"/></g>`;
    }
    let bldgs = "";
    for (let i = 0; i < 14; i++) {
      const bw = 60 + rand() * 130;
      const bh = 140 + rand() * 330;
      const bx = (i / 14) * W + rand() * 40;
      const g = 120 + rand() * 60;
      bldgs += `<rect x="${bx}" y="${560 - bh}" width="${bw}" height="${bh}" fill="rgb(${g | 0},${g | 0},${g | 0})"/>`;
    }
    inner = `
      <defs><radialGradient id="sun" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stop-color="#fff"/><stop offset="45%" stop-color="#cfcfcf"/><stop offset="100%" stop-color="#5a5a5a"/>
      </radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sun)"/>
      ${bldgs}
      <rect x="430" y="120" width="90" height="440" fill="#3c3c3c"/>
      <rect x="452" y="60" width="46" height="80" fill="#2e2e2e"/>
      <rect width="${W}" height="330" y="560" fill="#8a8a8a"/>
      ${bodies}`;
  } else if (kind === "fig-01") {
    let cols = "";
    for (let i = 0; i < 8; i++) {
      const cx = 340 + i * 132;
      cols += `<rect x="${cx}" y="380" width="46" height="380" fill="#d8d8d8"/>
               <rect x="${cx - 8}" y="368" width="62" height="16" fill="#bfbfbf"/>
               <rect x="${cx - 8}" y="756" width="62" height="18" fill="#bfbfbf"/>`;
    }
    inner = `
      <defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f2f2f2"/><stop offset="100%" stop-color="#9a9a9a"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky1)"/>
      <rect x="260" y="300" width="1080" height="60" fill="#c9c9c9"/>
      <polygon points="800,150 1360,310 240,310" fill="#dedede"/>
      <rect x="300" y="220" width="1000" height="10" fill="#8f8f8f"/>
      <circle cx="800" cy="252" r="34" fill="#efefef"/>
      ${cols}
      <rect x="240" y="774" width="1120" height="50" fill="#7c7c7c"/>
      <rect width="${W}" height="130" y="870" fill="#565656"/>`;
  } else if (kind === "fig-02") {
    let teeth = "";
    for (let i = 0; i < 7; i++) {
      const tx = 200 + i * 180;
      teeth += `<polygon points="${tx},420 ${tx + 110},300 ${tx + 110},420" fill="#e8e8e8"/>
                <polygon points="${tx + 110},300 ${tx + 180},420 ${tx + 110},420" fill="#9d9d9d"/>`;
    }
    let windows = "";
    for (let i = 0; i < 12; i++) {
      windows += `<rect x="${240 + i * 96}" y="480" width="56" height="150" fill="#d3d3d3"/>`;
    }
    inner = `
      <defs><linearGradient id="sky2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fafafa"/><stop offset="100%" stop-color="#7d7d7d"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sky2)"/>
      ${teeth}
      <rect x="200" y="420" width="1260" height="360" fill="#6f6f6f"/>
      ${windows}
      <rect width="${W}" height="220" y="780" fill="#4a4a4a"/>
      <rect x="1180" y="180" width="26" height="240" fill="#3a3a3a"/>`;
  } else {
    inner = `
      <defs><linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#808080"/><stop offset="100%" stop-color="#1a1a1a"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sweep)"/>
      <circle cx="1240" cy="120" r="200" fill="#e0e0e0"/>
      <circle cx="180" cy="420" r="140" fill="#4c4c4c"/>`;
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`
  );
}

async function sceneRaster(kind) {
  return sharp(svgScene(kind)).jpeg({ quality: 92 }).toBuffer();
}

/* ── contact sheet: one source at scales 2/3/4 side by side ── */
async function contactSheet(rawFiles) {
  const source =
    rawFiles.length > 0
      ? path.join(RAW_DIR, rawFiles[0])
      : await sceneRaster("hero");
  const label = rawFiles.length > 0 ? rawFiles[0] : "procedural hero";
  const TILE_H = 520;
  const GAP = 24;
  const tiles = [];
  for (const s of [2, 3, 4]) {
    const { png } = await computeDithered(source, s);
    const resized = await sharp(png)
      .resize(null, TILE_H)
      .png()
      .toBuffer();
    const m = await sharp(resized).metadata();
    tiles.push({ buf: resized, w: m.width });
  }
  const totalW = tiles.reduce((a, t) => a + t.w, 0) + GAP * 4;
  const composites = [];
  let x = GAP;
  for (const t of tiles) {
    composites.push({ input: t.buf, left: x, top: GAP });
    x += t.w + GAP;
  }
  await sharp({
    create: {
      width: totalW,
      height: TILE_H + GAP * 2,
      channels: 3,
      background: CREAM,
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(OUT_DIR, "contact-sheet.png"));
  console.log(
    `  ✓ contact-sheet.png  (${label} at scales 2 / 3 / 4, left to right)`
  );
}

/* ── main ──────────────────────────────────────────────────── */
async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let files = [];
  try {
    files = (await readdir(RAW_DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {
    /* no assets-raw dir */
  }

  if (testMode) {
    console.log("Contact sheet:");
    await contactSheet(files);
    return;
  }

  const produced = new Set();
  if (files.length > 0) {
    console.log(`Dithering ${files.length} photo(s) from ${RAW_DIR}/:`);
    for (const f of files) {
      const name = path.parse(f).name;
      await processImage(path.join(RAW_DIR, f), name);
      produced.add(name);
    }
  }
  const missing = ["hero", "fig-01", "fig-02", "band"].filter(
    (k) => !produced.has(k)
  );
  if (missing.length > 0) {
    console.log(`Procedural scenes for unclaimed names (${missing.join(", ")}):`);
    for (const kind of missing) {
      await processImage(await sceneRaster(kind), kind);
    }
  }
  console.log("Done → public/assets/dither/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
