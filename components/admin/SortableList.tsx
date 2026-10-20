"use client";

import { useRef, useState } from "react";
import { GOLD, MUTED } from "./ui";

type Drag = { from: number; to: number; dy: number; rects: DOMRect[]; startY: number };

/**
 * Vertical drag-to-reorder on pointer events, so it works with mouse,
 * touch, and pen (HTML5 drag-and-drop doesn't fire on phones). Rows
 * shift out of the way live; Move up/down buttons cover keyboards.
 */
export default function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderItem,
  gap = 12,
}: {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (next: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
}) {
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const onPointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rects = rowRefs.current.map((r) => r!.getBoundingClientRect());
    setDrag({ from: index, to: index, dy: 0, rects, startY: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const r = drag.rects[drag.from];
    const center = r.top + r.height / 2 + dy;
    // new index = how many OTHER rows sit above the dragged row's center
    const to = drag.rects.filter(
      (rect, i) => i !== drag.from && rect.top + rect.height / 2 < center
    ).length;
    setDrag({ ...drag, dy, to });
  };

  const onPointerUp = () => {
    if (drag) move(drag.from, drag.to);
    setDrag(null);
  };

  const offsetFor = (i: number): number => {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    const shift = drag.rects[drag.from].height + gap;
    if (drag.to > drag.from && i > drag.from && i <= drag.to) return -shift;
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return shift;
    return 0;
  };

  return (
    <ul className="flex flex-col" style={{ gap }}>
      {items.map((item, i) => {
        const dragging = drag?.from === i;
        return (
          <li
            key={getKey(item)}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="relative flex items-stretch"
            style={{
              transform: `translateY(${offsetFor(i)}px)`,
              transition: dragging ? "none" : "transform 200ms var(--ease-spilt)",
              zIndex: dragging ? 10 : 1,
              filter: dragging ? "drop-shadow(0 10px 18px rgba(42,38,32,0.18))" : undefined,
            }}
          >
            <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 pr-2">
              <button
                type="button"
                aria-label="Drag to reorder"
                onPointerDown={onPointerDown(i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                className="flex h-11 w-8 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
                style={{ color: dragging ? GOLD : MUTED }}
                tabIndex={-1}
              >
                <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden fill="currentColor">
                  {[3, 9, 15].map((y) => (
                    <g key={y}>
                      <circle cx="3" cy={y} r="1.5" />
                      <circle cx="9" cy={y} r="1.5" />
                    </g>
                  ))}
                </svg>
              </button>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="h-5 w-8 cursor-pointer text-[11px] disabled:opacity-25"
                  style={{ color: MUTED }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="h-5 w-8 cursor-pointer text-[11px] disabled:opacity-25"
                  style={{ color: MUTED }}
                >
                  ▼
                </button>
              </div>
            </div>
            <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
          </li>
        );
      })}
    </ul>
  );
}
