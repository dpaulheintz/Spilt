"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Generic toast surface. Each concept page mounts one and styles it
 * via className so the toast always matches the concept's aesthetic.
 */
export default function ToastHost({ className }: { className: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent).detail as string);
      setShown(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setShown(false), 2600);
    };
    window.addEventListener("spilt-toast", onToast);
    return () => {
      window.removeEventListener("spilt-toast", onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(10px)",
        transition:
          "opacity 300ms var(--ease-spilt), transform 300ms var(--ease-spilt)",
      }}
    >
      {msg && <div className={className}>{msg}</div>}
    </div>
  );
}
