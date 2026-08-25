"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND, EVENTS } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";

/* palette — this page only: near-black + candle ambers + gold */
const BLACK = "#070503";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";

type ObjDef = {
  id: string;
  src: string;
  x: number; // % of viewport width (center)
  y: number; // % of viewport height (center)
  w: number; // width as vw
  depth: number; // parallax px
  label: string;
  aria: string;
  anim?: "shimmer" | "rock" | "breathe" | "glint" | "sway" | "still";
};

/* tab order = left → right across the table */
const OBJECTS: ObjDef[] = [
  { id: "members", src: "/assets/still/obj-key.png", x: 9, y: 72, w: 13, depth: 8, label: "Members", aria: "A key on a ribbon — Members", anim: "glint" },
  { id: "events", src: "/assets/still/obj-watch.png", x: 25, y: 68, w: 18, depth: 10, label: "Events", aria: "An open pocket watch — Events", anim: "rock" },
  { id: "membership", src: "/assets/still/obj-coupe.png", x: 49, y: 60, w: 30, depth: 14, label: "Membership", aria: "A tipped coupe mid-splash — Membership", anim: "shimmer" },
  { id: "scenes", src: "/assets/still/obj-tintypes.png", x: 72, y: 46, w: 17, depth: 8, label: "Scenes", aria: "A vanitas cluster with tintype photographs — Scenes", anim: "still" },
  { id: "club", src: "/assets/still/obj-letter.png", x: 86, y: 74, w: 14, depth: 10, label: "The Club", aria: "A folded letter — The Club", anim: "breathe" },
  { id: "contact", src: "/assets/still/obj-bell.png", x: 95.5, y: 54, w: 9, depth: 8, label: "Ring for Service", aria: "A brass hand bell — Contact. Rings when pressed.", anim: "sway" },
];

/* ── soft bell 'ting' via WebAudio (no asset, autoplay-safe) ── */
function ringBell() {
  try {
    type AudioCtor = typeof AudioContext;
    const Ctor: AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: AudioCtor }).webkitAudioContext;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    for (const [freq, gain, decay] of [
      [1568, 0.16, 1.4],
      [2093, 0.07, 1.0],
      [3136, 0.03, 0.6],
    ]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g).connect(ctx.destination);
      o.start(now);
      o.stop(now + decay + 0.1);
    }
    setTimeout(() => ctx.close(), 2600);
  } catch {
    /* audio unavailable — the silence is also on-brand */
  }
}

/* ── panel definitions ─────────────────────────────────────── */
function PanelBody({ id }: { id: string }) {
  const [email, setEmail] = useState("");
  const [spoken, setSpoken] = useState(false);
  const [code, setCode] = useState("");

  const rule = (
    <div className="my-8 h-px w-full" style={{ backgroundColor: `${GOLD}66` }} aria-hidden />
  );

  switch (id) {
    case "membership":
      return (
        <>
          <h2 className="font-still text-5xl italic sm:text-6xl" style={{ color: GOLD_HI }}>
            Fill your cup.
          </h2>
          {rule}
          <p className="font-still max-w-xl text-lg leading-relaxed" style={{ color: GOLD }}>
            Accepting members Spring 2026. Limited seats, reviewed by people,
            not forms.
          </p>
          {spoken ? (
            <p aria-live="polite" className="font-still mt-10 text-2xl italic" style={{ color: GOLD_HI }}>
              Your glass is spoken for.
            </p>
          ) : (
            <form
              className="mt-10 flex w-full max-w-md items-baseline gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (/.+@.+\..+/.test(email)) setSpoken(true);
                else toast("The candle can't read that address.");
              }}
            >
              <label htmlFor="still-email" className="sr-only">
                Email address
              </label>
              <input
                id="still-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your correspondence"
                className="font-still w-full bg-transparent pb-2 text-lg italic placeholder:opacity-40 focus:outline-none"
                style={{ borderBottom: `1px solid ${GOLD}`, color: GOLD_HI }}
              />
              <button
                type="submit"
                className="still-caps shrink-0 cursor-pointer pb-2 hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4"
                style={{ color: GOLD, outlineColor: GOLD }}
              >
                Offer it up
              </button>
            </form>
          )}
        </>
      );
    case "events":
      return (
        <>
          <h2 className="font-still text-5xl italic sm:text-6xl" style={{ color: GOLD_HI }}>
            Want to see the future?
          </h2>
          {rule}
          <ul className="w-full max-w-2xl">
            {EVENTS.map((ev) => (
              <li
                key={ev.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5"
                style={{ borderBottom: `1px solid ${GOLD}44` }}
              >
                <span className="still-caps" style={{ color: GOLD }}>
                  {ev.date} · {ev.time}
                </span>
                <span className="font-still text-xl" style={{ color: GOLD_HI }}>
                  {ev.name}
                </span>
                <span className="font-still italic opacity-80" style={{ color: GOLD }}>
                  {ev.venue}, {ev.city}
                </span>
                <button
                  type="button"
                  onClick={() => toast("Noted by candlelight — the real build takes reservations.")}
                  className="still-caps cursor-pointer hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4"
                  style={{ color: GOLD, outlineColor: GOLD }}
                >
                  RSVP
                </button>
              </li>
            ))}
          </ul>
        </>
      );
    case "club":
      return (
        <>
          <h2 className="font-still text-5xl italic sm:text-6xl" style={{ color: GOLD_HI }}>
            The Club
          </h2>
          {rule}
          <div className="font-still max-w-xl space-y-6 text-lg leading-relaxed" style={{ color: GOLD }}>
            <p>
              Serendipity is a system. We set a long table, keep the light low,
              and seat the right strangers beside each other. The rest — the
              deals, the cofounders, the couldn&apos;t-have-planned-it — pours
              itself.
            </p>
            <p>
              These are the rooms where Columbus actually gets built. No name
              tags. No pitch decks. The city is early; the table is set anyway.
            </p>
          </div>
        </>
      );
    case "scenes":
      return (
        <>
          <h2 className="font-still text-4xl italic sm:text-5xl" style={{ color: GOLD_HI }}>
            The nights you&apos;ll wish you remembered.
          </h2>
          {rule}
          <div className="grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            {["The Hop", "Founders Fair", "MOVE Fest", "The Pour", "Late Study", "The Toast"].map(
              (cap, i) => (
                <figure key={cap} className="flex flex-col gap-3">
                  <div
                    className="aspect-[4/5] w-full"
                    style={{
                      background: `radial-gradient(ellipse at ${30 + (i % 3) * 20}% ${35 + (i % 2) * 20}%, #241a10 0%, #120c07 55%, #070503 100%)`,
                      border: `1px solid ${GOLD}33`,
                    }}
                    aria-hidden
                  />
                  <figcaption className="still-caps text-center" style={{ color: GOLD }}>
                    {cap}
                  </figcaption>
                </figure>
              )
            )}
          </div>
          <p className="font-still mt-8 italic opacity-60" style={{ color: GOLD }}>
            Plates develop after each gathering. These are still in the bath.
          </p>
        </>
      );
    case "members":
      return (
        <>
          <h2 className="font-still text-5xl italic sm:text-6xl" style={{ color: GOLD_HI }}>
            Members
          </h2>
          {rule}
          <p className="font-still max-w-md text-lg italic" style={{ color: GOLD }}>
            You&apos;d know if this opened for you.
          </p>
          <form
            className="mt-10 flex w-full max-w-xs items-baseline gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast("Not yet.");
            }}
          >
            <label htmlFor="still-code" className="sr-only">
              Passcode
            </label>
            <input
              id="still-code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="passcode"
              className="font-still w-full bg-transparent pb-2 text-lg tracking-[0.4em] placeholder:tracking-normal placeholder:italic placeholder:opacity-40 focus:outline-none"
              style={{ borderBottom: `1px solid ${GOLD}`, color: GOLD_HI }}
            />
            <button
              type="submit"
              className="still-caps shrink-0 cursor-pointer pb-2 hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4"
              style={{ color: GOLD, outlineColor: GOLD }}
            >
              Try
            </button>
          </form>
        </>
      );
    case "contact":
      return (
        <>
          <h2 className="font-still text-5xl italic sm:text-6xl" style={{ color: GOLD_HI }}>
            Ring twice for the host.
          </h2>
          {rule}
          <p className="font-still text-lg" style={{ color: GOLD }}>
            {BRAND.contact}
          </p>
          <div className="mt-6 flex gap-8">
            {["Instagram", "X", "LinkedIn"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toast("The host will pass it along — concept mockup.")}
                className="still-caps cursor-pointer hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4"
                style={{ color: GOLD, outlineColor: GOLD }}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      );
    default:
      return null;
  }
}

/* ── main scene ────────────────────────────────────────────── */
export default function StillContent() {
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [lostOpen, setLostOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [bellSwing, setBellSwing] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const objRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const imgWrapRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const mouse = useRef({ x: -9999, y: -9999, gx: -9999, gy: -9999, px: 0, py: 0, lpx: 0, lpy: 0 });
  const focusTarget = useRef<string | null>(null);

  useEffect(() => {
    const mqM = window.matchMedia("(max-width: 767px)");
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setIsMobile(mqM.matches);
      setReduced(mqR.matches);
    };
    update();
    mqM.addEventListener("change", update);
    mqR.addEventListener("change", update);
    return () => {
      mqM.removeEventListener("change", update);
      mqR.removeEventListener("change", update);
    };
  }, []);

  /* pointer + candle-glow + proximity + parallax loop */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const m = mouse.current;

    const onMove = (e: PointerEvent) => {
      m.x = e.clientX;
      m.y = e.clientY;
      focusTarget.current = null;
      m.px = (e.clientX / window.innerWidth - 0.5) * 2;
      m.py = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouch = (e: TouchEvent) => {
      m.x = e.touches[0].clientX;
      m.y = e.touches[0].clientY;
    };

    const frame = () => {
      // focused object overrides pointer as light target
      if (focusTarget.current) {
        const el = objRefs.current[focusTarget.current];
        if (el) {
          const r = el.getBoundingClientRect();
          m.x = r.left + r.width / 2;
          m.y = r.top + r.height / 2;
        }
      }
      // lerp glow
      m.gx += (m.x - m.gx) * 0.1;
      m.gy += (m.y - m.gy) * 0.1;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${m.gx - 170}px, ${m.gy - 170}px)`;
      }
      // lerp parallax
      m.lpx += (m.px - m.lpx) * 0.06;
      m.lpy += (m.py - m.lpy) * 0.06;

      for (const o of OBJECTS) {
        const btn = objRefs.current[o.id];
        if (!btn) continue;
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(m.gx - cx, m.gy - cy);
        const t = Math.max(0, 1 - d / 220); // 0 far → 1 at center
        const bright = 0.82 + t * 0.33; // rest 0.82 → 1.15 at the flame
        const scale = 1 + t * 0.03;
        btn.style.setProperty("--obj-bright", bright.toFixed(3));
        btn.style.setProperty("--obj-scale", scale.toFixed(3));
        if (!isMobile) {
          btn.style.setProperty("--plx", `${(-m.lpx * o.depth).toFixed(1)}px`);
          btn.style.setProperty("--ply", `${(-m.lpy * o.depth * 0.6).toFixed(1)}px`);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [reduced, isMobile]);

  /* Esc closes panel */
  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPanel]);

  const activate = useCallback((id: string) => {
    if (id === "contact") {
      ringBell();
      setBellSwing(true);
      setTimeout(() => setBellSwing(false), 900);
    }
    setOpenPanel(id);
    setLostOpen(false);
  }, []);

  const panelTitleId = openPanel ? `still-panel-${openPanel}` : undefined;

  return (
    <div
      className="font-still relative min-h-dvh overflow-hidden"
      style={{ backgroundColor: BLACK, color: GOLD }}
    >
      {/* ── the table (dims + blurs behind panels) ─────────── */}
      <div
        ref={sceneRef}
        className={isMobile ? "relative" : "relative h-dvh min-h-[600px]"}
        style={{
          filter: openPanel ? "blur(4px) brightness(0.55)" : "none",
          transition: "filter 600ms var(--ease-spilt)",
        }}
        aria-hidden={openPanel ? true : undefined}
      >
        {/* base: walnut table, bottom-anchored */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/still/bg-table.png"
          alt=""
          aria-hidden
          className={
            isMobile
              ? "pointer-events-none fixed top-0 left-0 h-dvh w-full object-cover opacity-70"
              : "pointer-events-none absolute bottom-0 left-0 w-full object-cover"
          }
          style={{
            mixBlendMode: "lighten",
            /* keep the table below the objects' highlights — the room sleeps */
            filter: "brightness(0.55) saturate(0.92)",
            ...(isMobile ? {} : { height: "100%", objectPosition: "center bottom" }),
          }}
        />

        {/* floating copy */}
        <div className={isMobile ? "absolute inset-x-0 top-0 z-10" : "absolute inset-x-0 top-0 z-10"}>
          <p className="still-caps pt-7 text-center" style={{ color: GOLD }}>
            Spilt Social · Columbus, Ohio
          </p>
          <p
            className="font-still mx-auto mt-6 max-w-2xl px-6 text-center text-2xl italic sm:text-3xl"
            style={{ color: GOLD_HI }}
          >
            Members know which object opens the door.
          </p>
          <p
            className="font-still mx-auto mt-3 px-6 text-center text-sm italic"
            style={{ color: GOLD, opacity: 0.6 }}
          >
            Nothing on this table is clickable. Especially not the cup.
          </p>
        </div>

        {/* corners */}
        <span className="still-caps absolute top-7 left-6 z-10 hidden md:block" style={{ color: GOLD }}>
          Spilt
        </span>
        <span className="still-caps absolute top-7 right-6 z-10 hidden md:block" style={{ color: GOLD }}>
          05 / 05
        </span>
        <span
          className="still-caps absolute right-6 bottom-5 z-10 hidden sm:block"
          style={{ color: GOLD, opacity: 0.55 }}
        >
          Est. 2023 · By invitation, mostly.
        </span>

        {/* ── the objects ────────────────────────────────────── */}
        <div
          /* no z-index here: a stacking context would isolate the
             mix-blend-mode compositing from the table layer below */
          className={
            isMobile
              ? "relative mx-auto flex w-full max-w-md flex-col items-center gap-2 px-6 pt-60 pb-32"
              : "absolute inset-0"
          }
        >
          {OBJECTS.map((o) => (
            <button
              key={o.id}
              ref={(el) => {
                objRefs.current[o.id] = el;
              }}
              type="button"
              aria-label={o.aria}
              onClick={() => activate(o.id)}
              onFocus={() => {
                focusTarget.current = o.id;
              }}
              onBlur={() => {
                focusTarget.current = null;
              }}
              className="still-obj group cursor-pointer focus:outline-none"
              style={
                isMobile
                  ? { width: "min(70vw, 320px)" }
                  : {
                      /* no transform here — it would create a stacking
                         context and isolate the blend compositing */
                      position: "absolute",
                      left: `${o.x - o.w / 2}vw`,
                      top: `calc(${o.y}% - ${(o.w * 0.4).toFixed(1)}vw)`,
                      width: `${o.w}vw`,
                    }
              }
            >
              <span
                ref={(el) => {
                  imgWrapRefs.current[o.id] = el;
                }}
                className="still-obj-img block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.src}
                  alt=""
                  className={`still-img block w-full select-none ${
                    reduced ? "" : `still-anim-${o.anim}`
                  } ${o.id === "contact" && bellSwing ? "still-bell-swing" : ""}`}
                  draggable={false}
                />
                {/* specular sweep overlays for shimmer/glint */}
                {(o.anim === "shimmer" || o.anim === "glint") && !reduced && (
                  <span aria-hidden className={`still-sweep still-sweep-${o.anim}`} />
                )}
              </span>
              <span
                className={`still-label still-caps pointer-events-none mx-auto block w-max ${
                  isMobile ? "still-label-mobile" : ""
                }`}
                style={{ color: GOLD_HI }}
              >
                {o.label}
                <span className="still-label-rule block" aria-hidden />
              </span>
            </button>
          ))}
        </div>

        {/* Lost? fallback */}
        <div className="absolute bottom-5 left-6 z-20">
          <button
            type="button"
            onClick={() => setLostOpen((v) => !v)}
            aria-expanded={lostOpen}
            className="still-caps cursor-pointer focus-visible:outline-1 focus-visible:outline-offset-4"
            style={{ color: GOLD, opacity: lostOpen ? 1 : 0.45, outlineColor: GOLD }}
          >
            Lost?
          </button>
          {lostOpen && (
            <div
              className="mt-3 flex flex-col items-start gap-2 border-l pl-4"
              style={{ borderColor: `${GOLD}66` }}
            >
              {OBJECTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => activate(o.id)}
                  className="still-caps cursor-pointer hover:opacity-100 focus-visible:outline-1 focus-visible:outline-offset-4"
                  style={{ color: GOLD_HI, opacity: 0.85, outlineColor: GOLD }}
                >
                  {o.id === "contact" ? "Contact" : o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── the candle glow (cursor) ───────────────────────── */}
      {!reduced && !openPanel && (
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-30 h-[340px] w-[340px]"
          style={{
            background:
              "radial-gradient(circle, rgba(232,180,110,0.55) 0%, rgba(190,130,60,0.22) 40%, transparent 70%)",
            mixBlendMode: "soft-light",
          }}
        />
      )}

      {/* ── overlay panel ──────────────────────────────────── */}
      {openPanel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={panelTitleId}
          className="still-panel fixed inset-0 z-40 overflow-y-auto"
          style={{ backgroundColor: "rgba(7,5,3,0.97)" }}
        >
          <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center px-6 py-16">
            <div className="h-px w-full" style={{ backgroundColor: `${GOLD}88` }} aria-hidden />
            <div id={panelTitleId} className="still-panel-body flex flex-col items-start py-14">
              <PanelBody id={openPanel} />
            </div>
            <div className="h-px w-full" style={{ backgroundColor: `${GOLD}88` }} aria-hidden />
            <button
              type="button"
              autoFocus
              onClick={() => setOpenPanel(null)}
              className="still-caps mx-auto mt-10 cursor-pointer hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4"
              style={{ color: GOLD, outlineColor: GOLD }}
            >
              Return to the table
            </button>
          </div>
        </div>
      )}

      <ToastHost className="font-still pointer-events-auto border px-6 py-3 text-sm italic [border-color:#C69D6066] bg-[#070503] text-[#C69D60]" />
    </div>
  );
}
