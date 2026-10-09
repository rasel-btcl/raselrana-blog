"use client";

import { useEffect, useState } from "react";

// A heading counts as "current" once it has scrolled up to just below the sticky bar.
const ACTIVE_OFFSET = 110;

/** Links are plain anchors in the HTML; the script only adds the highlight. */
export default function TableOfContents({ items }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = null;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
        else break;
      }
      setActiveId(current);
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
  }, [items]);

  return (
    <ul className="space-y-1 border-l border-[var(--line)]">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={`-ml-px block border-l py-1 text-sm leading-snug transition-colors ${
                item.depth === 3 ? "pl-7" : "pl-4"
              } ${
                active
                  ? "border-[var(--signal)] font-medium text-[var(--signal)]"
                  : "border-transparent text-[var(--slate)] hover:text-[var(--ink)]"
              }`}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
