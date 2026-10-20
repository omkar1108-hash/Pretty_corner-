"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 8000; // how long each picture stays before the next fades in
const FADE_MS = 2300; // must be a little longer than the CSS opacity transition

/**
 * Full-screen background behind the whole shop: product photos that slowly zoom
 * and cross-fade into each other, under a soft pink wash so text stays readable.
 * The picture changes on a timer and also as you scroll through the page
 * (SmoothScroll fires "bg-step" every ~1.5 screens: +1 going down, -1 going up).
 */
export default function BackgroundStage({ images }: { images: string[] }) {
  const n = images.length;
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const current = useRef(0);
  const clearLeaving = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastChange = useRef(0);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (n < 2) return;
      const from = current.current;
      const to = (from + dir + n) % n;
      current.current = to;
      lastChange.current = Date.now();
      setLeaving(from);
      setActive(to);
      clearTimeout(clearLeaving.current);
      clearLeaving.current = setTimeout(() => setLeaving(null), FADE_MS);
    },
    [n],
  );

  useEffect(() => {
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      // skip while the tab is hidden, or if scrolling just changed the picture
      if (document.visibilityState === "visible" && Date.now() - lastChange.current > HOLD_MS - 500) step(1);
    }, 1000);
    const onStep = (e: Event) => step((e as CustomEvent<1 | -1>).detail);
    window.addEventListener("bg-step", onStep);

    return () => {
      clearInterval(timer);
      clearTimeout(clearLeaving.current);
      window.removeEventListener("bg-step", onStep);
    };
  }, [n, step]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream">
      {/* SmoothScroll zooms this wrapper as the page scrolls ("diving in"), on top of the slow zoom of each slide */}
      <div data-bg-zoom className="absolute inset-0 will-change-transform">
        {images.map((src, i) => (
          <div
            key={src}
            className={`bg-slide ${i === active ? "is-active" : ""} ${i === leaving ? "is-leaving" : ""}`}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
      </div>
      {/* soft pink wash + a little gold warmth at the top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(184,137,59,0.16), transparent 60%)," +
            "linear-gradient(180deg, rgba(255,248,244,0.66), rgba(253,232,238,0.76))",
        }}
      />
    </div>
  );
}
