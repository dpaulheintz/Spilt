"use client";

import { useEffect, useRef } from "react";

/* ── palette (this page only) ─────────────────────────────── */
const INK = "#0B0A08";
const IVORY = "#F2EDE3";
const GOLD = "#C69D60"; // particles in motion
const GOLD_HI = "#E8C687"; // particles moving fast — the spark

/* ── physics tuning ───────────────────────────────────────── */
const SPRING = 0.016; // pull toward home
const DAMPING = 0.88; // velocity decay → word heals over ~1s
const REPULSE_R = 90; // cursor force radius (px)
const REPULSE_STR = 5.2; // push strength
const SMEAR = 0.38; // how much cursor velocity carries particles
const MAX_V = 24; // per-frame displacement cap: shatters, never explodes
const ERASE_R = 65; // skyline erase radius
const HEAL_RATE = 0.006; // skyline heal per frame (~3s)

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function PixelHero({
  eyebrow,
  subline,
}: {
  eyebrow: string;
  subline: string;
}) {
  const wrapRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);
  const wordRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const skyCanvas = skyRef.current;
    const wordCanvas = wordRef.current;
    if (!wrap || !skyCanvas || !wordCanvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;

    const skyCtx = skyCanvas.getContext("2d")!;
    const wordCtx = wordCanvas.getContext("2d")!;

    let W = 0;
    let H = 0;

    /* word particles (typed arrays, allocated once per build) */
    let count = 0;
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let dotSize = 2;

    /* skyline dots */
    let sCount = 0;
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);
    let heal = new Float32Array(0);
    let thresh = new Float32Array(0);
    let skyDirty = true;
    let skylineImg: HTMLImageElement | null = null;

    /* pointer state */
    const mouse = { x: -9e3, y: -9e3, lx: -9e3, ly: -9e3, vx: 0, vy: 0, active: false };
    let windT = Math.random() * 100;
    let settled = 0;

    let raf = 0;
    let running = false;
    let inView = true;
    let destroyed = false;

    /* ── build word particles from rasterized "SPILT" ─────── */
    function buildWord() {
      const family =
        getComputedStyle(wrap!).getPropertyValue("--font-pixel").trim() ||
        "monospace";
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const octx = off.getContext("2d", { willReadFrequently: true })!;
      octx.font = `700 100px ${family}`;
      const w100 = octx.measureText("SPILT").width || 300;
      const size = Math.min((100 * (0.7 * W)) / w100, H * 0.42);
      octx.font = `700 ${size}px ${family}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#000";
      octx.fillText("SPILT", W / 2, H * 0.42);
      const data = octx.getImageData(0, 0, W, H).data;

      const cap = touch ? 4500 : 13000;
      let step = touch ? 3 : 3;
      let n = 0;
      for (;;) {
        n = 0;
        for (let y = 0; y < H; y += step)
          for (let x = 0; x < W; x += step)
            if (data[(y * W + x) * 4 + 3] > 128) n++;
        if (n <= cap || step > 12) break;
        step++;
      }
      count = n;
      hx = new Float32Array(n);
      hy = new Float32Array(n);
      px = new Float32Array(n);
      py = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      let i = 0;
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step)
          if (data[(y * W + x) * 4 + 3] > 128) {
            hx[i] = x;
            hy[i] = y;
            px[i] = x;
            py[i] = y;
            i++;
          }
      dotSize = Math.max(2, Math.round(step * 0.62));
    }

    /* ── build skyline dither strip ───────────────────────── */
    function buildSky() {
      if (W < 10 || H < 10) return;
      const SH = Math.round(H * 0.24);
      const y0 = Math.round(H * 0.7);
      const off = document.createElement("canvas");
      off.width = W;
      off.height = SH;
      const octx = off.getContext("2d", { willReadFrequently: true })!;

      if (skylineImg) {
        // cover-fit the provided photo
        const s = Math.max(W / skylineImg.width, SH / skylineImg.height);
        const dw = skylineImg.width * s;
        const dh = skylineImg.height * s;
        octx.drawImage(skylineImg, (W - dw) / 2, (SH - dh) / 2, dw, dh);
      } else {
        // procedural: gradient sky + Columbus-ish silhouette
        const g = octx.createLinearGradient(0, 0, 0, SH);
        g.addColorStop(0, "#f5f5f5");
        g.addColorStop(1, "#a6a6a6");
        octx.fillStyle = g;
        octx.fillRect(0, 0, W, SH);
        const rand = mulberry32(20260916);
        octx.fillStyle = "#141414";
        let x = 0;
        while (x < W) {
          const bw = 26 + rand() * 70;
          const bh = SH * (0.2 + rand() * 0.42);
          octx.fillRect(x, SH - bh, bw, bh);
          x += bw + rand() * 18;
        }
        // LeVeque-style stepped tower
        const tx = W * 0.28;
        const tw = Math.max(28, W * 0.035);
        octx.fillRect(tx, SH * 0.12, tw, SH);
        octx.fillRect(tx + tw * 0.25, SH * 0.05, tw * 0.5, SH);
        octx.fillRect(tx + tw * 0.42, 0, tw * 0.16, SH); // antenna
        // ground line
        octx.fillRect(0, SH - 2, W, 2);
      }

      const data = octx.getImageData(0, 0, W, SH).data;
      const cap = touch ? 2400 : 8000;
      let step = touch ? 7 : 5;
      const countAt = (s: number) => {
        let n = 0;
        for (let y = 0; y < SH; y += s)
          for (let x = 0; x < W; x += s) {
            const k = (y * W + x) * 4;
            const lum =
              (data[k] * 0.299 + data[k + 1] * 0.587 + data[k + 2] * 0.114) /
              255;
            if (lum < (BAYER[(y / s) % 4 | 0][(x / s) % 4 | 0] + 0.5) / 16)
              n++;
          }
        return n;
      };
      let n = countAt(step);
      while (n > cap && step < 14) {
        step++;
        n = countAt(step);
      }
      sCount = n;
      sx = new Float32Array(n);
      sy = new Float32Array(n);
      heal = new Float32Array(n).fill(1);
      thresh = new Float32Array(n);
      const rand = mulberry32(1003);
      let i = 0;
      for (let y = 0; y < SH; y += step)
        for (let x = 0; x < W; x += step) {
          const k = (y * W + x) * 4;
          const lum =
            (data[k] * 0.299 + data[k + 1] * 0.587 + data[k + 2] * 0.114) / 255;
          if (
            lum <
            (BAYER[(y / step) % 4 | 0][(x / step) % 4 | 0] + 0.5) / 16
          ) {
            sx[i] = x;
            sy[i] = y0 + y;
            thresh[i] = 0.25 + rand() * 0.65;
            i++;
          }
        }
      skyDirty = true;
    }

    function drawSky() {
      // gold-tinted dither at low opacity — city lights on ink
      skyCtx.clearRect(0, 0, W, H);
      skyCtx.fillStyle = GOLD;
      skyCtx.globalAlpha = 0.32;
      for (let i = 0; i < sCount; i++)
        if (heal[i] >= thresh[i]) skyCtx.fillRect(sx[i] | 0, sy[i] | 0, 2, 2);
      skyCtx.globalAlpha = 1;
    }

    function drawWord() {
      // three heat bins: ivory at rest → champagne in motion → highlight
      // gold at speed; particles cool back to ivory as they settle home
      wordCtx.clearRect(0, 0, W, H);
      const d = dotSize;
      const o = d / 2;
      for (let bin = 0; bin < 3; bin++) {
        wordCtx.fillStyle = bin === 0 ? IVORY : bin === 1 ? GOLD : GOLD_HI;
        for (let i = 0; i < count; i++) {
          const v2 = vx[i] * vx[i] + vy[i] * vy[i];
          const dx = px[i] - hx[i];
          const dy = py[i] - hy[i];
          const d2 = dx * dx + dy * dy;
          const b = v2 > 7 ? 2 : v2 > 0.35 || d2 > 120 ? 1 : 0;
          if (b === bin) wordCtx.fillRect((px[i] - o) | 0, (py[i] - o) | 0, d, d);
        }
      }
    }

    /* ── per-frame simulation ─────────────────────────────── */
    function frame() {
      // active force point: cursor, or drifting "wind" on touch
      let fx = mouse.x;
      let fy = mouse.y;
      let fvx = mouse.vx;
      let fvy = mouse.vy;
      let fActive = mouse.active;
      let fR = REPULSE_R;
      let fStr = REPULSE_STR;
      if (!fActive && touch) {
        windT += 0.016;
        fx = W * (0.5 + 0.36 * Math.sin(windT * 0.55));
        fy = H * (0.42 + 0.1 * Math.sin(windT * 1.3));
        fvx = Math.cos(windT * 0.55) * 3;
        fvy = 0;
        fActive = true;
        fR = 76;
        fStr = 2.2;
      }

      // word physics
      let energy = 0;
      const r2 = fR * fR;
      for (let i = 0; i < count; i++) {
        let vxi = (vx[i] + (hx[i] - px[i]) * SPRING) * DAMPING;
        let vyi = (vy[i] + (hy[i] - py[i]) * SPRING) * DAMPING;
        if (fActive) {
          const dx = px[i] - fx;
          const dy = py[i] - fy;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const fall = 1 - d / fR;
            const imp = fall * fall * fStr;
            vxi += (dx / d) * imp + fvx * fall * SMEAR;
            vyi += (dy / d) * imp + fvy * fall * SMEAR;
          }
        }
        const sp2 = vxi * vxi + vyi * vyi;
        if (sp2 > MAX_V * MAX_V) {
          const s = MAX_V / Math.sqrt(sp2);
          vxi *= s;
          vyi *= s;
        }
        vx[i] = vxi;
        vy[i] = vyi;
        px[i] += vxi;
        py[i] += vyi;
        energy += vxi * vxi + vyi * vyi;
      }

      // skyline erase + heal
      if (fActive) {
        const er2 = ERASE_R * ERASE_R;
        const mx = (fx + mouse.lx) / 2;
        const my = (fy + mouse.ly) / 2;
        for (let i = 0; i < sCount; i++) {
          const dx1 = sx[i] - fx;
          const dy1 = sy[i] - fy;
          const dx2 = sx[i] - mx;
          const dy2 = sy[i] - my;
          if (dx1 * dx1 + dy1 * dy1 < er2 || dx2 * dx2 + dy2 * dy2 < er2) {
            heal[i] = 0;
            skyDirty = true;
          }
        }
      }
      let healing = false;
      for (let i = 0; i < sCount; i++)
        if (heal[i] < 1) {
          heal[i] = Math.min(1, heal[i] + HEAL_RATE);
          healing = true;
        }
      if (healing) skyDirty = true;

      if (skyDirty) {
        drawSky();
        skyDirty = false;
      }

      // settle-skip: stop repainting the word when fully at rest
      if (energy < 0.02 && !fActive) settled++;
      else settled = 0;
      if (settled < 30) drawWord();

      // decay cursor velocity between move events
      mouse.vx *= 0.8;
      mouse.vy *= 0.8;
      mouse.lx = fx;
      mouse.ly = fy;

      if (process.env.NODE_ENV !== "production") {
        const dbg = ((window as unknown as Record<string, unknown>).__spiltDebug ??=
          {}) as Record<string, unknown>;
        dbg.frames = ((dbg.frames as number) ?? 0) + 1;
        dbg.energy = energy;
        dbg.count = count;
        dbg.settled = settled;
        dbg.mouseActive = fActive;
        dbg.disp0 = Math.hypot(px[0] - hx[0], py[0] - hy[0]);
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced || destroyed) return;
      if (document.hidden || !inView) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /* ── build everything at current size ─────────────────── */
    function build() {
      const rect = wrap!.getBoundingClientRect();
      W = Math.round(rect.width);
      H = Math.round(rect.height);
      if (W < 10 || H < 10) return; // layout not ready yet
      // dpr 1 + image-rendering:pixelated → chunky dots, 4× cheaper fills
      for (const c of [skyCanvas!, wordCanvas!]) {
        c.width = W;
        c.height = H;
      }
      buildWord();
      buildSky();
      drawSky();
      drawWord();
    }

    /* ── events ───────────────────────────────────────────── */
    const onMove = (e: PointerEvent) => {
      const r = wordCanvas!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      mouse.vx = mouse.vx * 0.5 + (x - mouse.x) * 0.5;
      mouse.vy = mouse.vy * 0.5 + (y - mouse.y) * 0.5;
      mouse.x = x;
      mouse.y = y;
      mouse.active = x > -40 && y > -40 && x < r.width + 40 && y < r.height + 40;
      if (mouse.active) settled = 0;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9e3;
      mouse.y = -9e3;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      const r = wordCanvas!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > r.height) return;
      // radial burst at tap point
      const R = 130;
      for (let i = 0; i < count; i++) {
        const dx = px[i] - x;
        const dy = py[i] - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const imp = (1 - d / R) * 14;
          vx[i] += (dx / d) * imp;
          vy[i] += (dy / d) * imp;
        }
      }
      const er2 = 90 * 90;
      for (let i = 0; i < sCount; i++) {
        const dx = sx[i] - x;
        const dy = sy[i] - y;
        if (dx * dx + dy * dy < er2) heal[i] = 0;
      }
      skyDirty = true;
      settled = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (destroyed) return;
        build();
      }, 200);
    });
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { threshold: 0 }
    );

    /* ── boot ─────────────────────────────────────────────── */
    ro.observe(wrap);
    io.observe(wrap);
    let bootTries = 0;
    function boot() {
      if (destroyed) return;
      const rect = wrap!.getBoundingClientRect();
      if ((rect.width < 10 || rect.height < 10) && bootTries++ < 120) {
        requestAnimationFrame(boot);
        return;
      }
      build();
      start();
    }
    document.fonts.ready.then(() => requestAnimationFrame(boot));

    // optional real skyline photo; procedural fallback already in place
    const img = new Image();
    img.onload = () => {
      if (destroyed) return;
      skylineImg = img;
      buildSky();
      drawSky();
    };
    img.src = "/assets/pixel-skyline.jpg";

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      destroyed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative h-dvh min-h-[560px] overflow-hidden"
      style={{ backgroundColor: INK }}
      aria-label="SPILT — interactive wordmark"
    >
      <canvas
        ref={skyRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <canvas
        ref={wordRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      {/* DOM overlay — never intercepts canvas play, buttons re-enable pointer events */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <p
          className="absolute top-[19%] left-1/2 w-full -translate-x-1/2 px-4 text-center font-mono text-[11px] tracking-[0.34em] uppercase sm:text-xs"
          style={{ color: IVORY }}
        >
          {eyebrow}
        </p>
        <p
          className="font-italiana absolute top-[63%] left-1/2 w-full -translate-x-1/2 px-4 text-center text-lg sm:text-2xl"
          style={{ color: IVORY }}
        >
          {subline}
        </p>
        <p
          className="absolute bottom-6 left-6 font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: IVORY, opacity: 0.5 }}
        >
          Scroll ↓
        </p>
      </div>
    </section>
  );
}
