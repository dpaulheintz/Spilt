import { CONCEPTS } from "@/lib/concepts";
import { BRAND } from "@/lib/brand";

/**
 * Minimal per-concept placeholder shown until the concept page is built.
 * Each one hints at its palette + typographic direction only.
 */
export default function Placeholder({ slug }: { slug: string }) {
  const concept = CONCEPTS.find((c) => c.slug === slug)!;

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ backgroundColor: concept.bg, color: concept.fg }}
    >
      <p
        className="font-mono text-[11px] tracking-[0.3em] uppercase"
        style={{ opacity: 0.6 }}
      >
        {BRAND.positioning}
      </p>

      <h1
        className="text-4xl font-bold tracking-[0.08em] uppercase sm:text-6xl"
        style={{ color: concept.fg }}
      >
        {BRAND.name}
      </h1>

      <div
        className="h-px w-16"
        style={{ backgroundColor: concept.accent }}
        aria-hidden
      />

      <p className="font-mono text-sm tracking-[0.2em] uppercase">
        Concept {concept.number} — {concept.name}
      </p>

      <p
        className="font-mono text-xs tracking-[0.15em] uppercase"
        style={{ color: concept.accent }}
      >
        Coming soon
      </p>
    </main>
  );
}
