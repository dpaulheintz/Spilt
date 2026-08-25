"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll reveal: opacity + 20px rise, 800ms, [0.16,1,0.3,1].
 * Reduced-motion users get an instant reveal (global CSS zeroes durations).
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 800ms var(--ease-spilt) ${delay}ms, transform 800ms var(--ease-spilt) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
