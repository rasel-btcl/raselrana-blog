"use client";

import { useEffect, useRef } from "react";

/**
 * Thin line at the very top of the window that fills while the element with
 * `targetId` is read. Render it outside any `rise`/`reveal` element: those are
 * transformed, and position: fixed would then stick to them instead of the window.
 */
export default function ReadingProgress({ targetId }) {
  const barRef = useRef(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const target = document.getElementById(targetId);
      const bar = barRef.current;
      if (!target || !bar) return;

      const rect = target.getBoundingClientRect();
      const distance = rect.height - window.innerHeight * 0.6;
      const done = distance > 0 ? -rect.top / distance : rect.top <= 0 ? 1 : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, done))})`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--signal)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
