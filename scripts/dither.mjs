#!/usr/bin/env node
/**
 * Spilt Social dither pipeline — cobalt-on-cream ordered-dither duotone.
 *
 * Usage:
 *   npm run dither                 # Bayer 8x8, scale 3, cobalt/cream
 *   npm run dither -- --scale 2    # chunkier/finer pixels (2|3|4)
 *   npm run dither -- --fs         # Floyd–Steinberg error diffusion
 *   npm run dither -- --color      # teal #2A6B8A variant
 *
 * Input:  every image in assets-raw/  (jpg/jpeg/png/webp)
 * Output: public/assets/dither/<name>.png
 *
 * If assets-raw/ is empty, four procedural placeholder scenes
 * (hero, fig-01, fig-02, band) are generated through the same pipeline
 * so the /dither page always demos.
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
const scaleIdx = argv.indexOf("--scale");
const SCALE = scaleIdx >= 0 ? Math.max(1, parseInt(argv[scaleIdx + 1], 10) || 3) : 3;
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

function ditherBayer(gray, w, h) {
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const t = ((BAYER8[y % 8][x % 8] + 0.5) / 64) * 255;
      const c = gray[i] < t ? DARK : CREAM;
      out[i * 3] = c.r;
      out[i * 3 + 1] = c.g;
      out[i * 3 + 2] = c.b;
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
      const val = isDark ? 0 : 255;
      const err = old - val;
      const c = isDark ? DARK : CREAM;
      out[i * 3] = c.r;
      out[i * 3 + 1] = c.g;
      out[i * 3 + 2] = c.b;
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

/* ── pipeline: input buffer/path → dithered PNG ────────────── */
async function processImage(input, outName) {
  // full-size grayscale, normalized (histogram stretch)
  const base = sharp(input).rotate().resize(1600, null, {
    withoutEnlargement: true,
    fit: "inside",
  });
  const meta = await base.clone().grayscale().normalise().toBuffer({
    resolveWithObject: true,
  });
  const fullW = meta.info.width;
  const fullH = meta.info.height;

  // dither at reduced resolution → chunky visible dots when upscaled
  const smallW = Math.max(8, Math.round(fullW / SCALE));
  const smallH = Math.max(8, Math.round(fullH / SCALE));
  const { data } = await sharp(meta.data)
    .resize(smallW, smallH, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgb = useFS
    ? ditherFloydSteinberg(data, smallW, smallH)
    : ditherBayer(data, smallW, smallH);

  await sharp(rgb, { raw: { width: smallW, height: smallH, channels: 3 } })
    .resize(smallW * SCALE, smallH * SCALE, { kernel: "nearest" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(OUT_DIR, `${outName}.png`));

  console.log(
    `  ✓ ${outName}.png  (${smallW * SCALE}x${smallH * SCALE}, scale ${SCALE}, ${
      useFS ? "floyd-steinberg" : "bayer8"
    }${useTeal ? ", teal" : ""})`
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
    // crowd silhouettes under a lit skyline
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
    // statehouse: pediment + columns
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
    // the loom: sawtooth roofline warehouse, hard light
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
    // band: diagonal sweep texture for the membership strip
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

/* ── main ──────────────────────────────────────────────────── */
async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let files = [];
  try {
    files = (await readdir(RAW_DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {
    /* no assets-raw dir */
  }

  if (files.length > 0) {
    console.log(`Dithering ${files.length} photo(s) from ${RAW_DIR}/:`);
    for (const f of files) {
      const name = path.parse(f).name;
      await processImage(path.join(RAW_DIR, f), name);
    }
  } else {
    console.log("assets-raw/ is empty — generating procedural placeholder scenes:");
    for (const kind of ["hero", "fig-01", "fig-02", "band"]) {
      const svg = svgScene(kind);
      const raster = await sharp(svg).jpeg({ quality: 92 }).toBuffer();
      await processImage(raster, kind);
    }
  }
  console.log("Done → public/assets/dither/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
