"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 8000; // how long each picture stays before the next fades in
const FADE_MS = 2300; // must be a little longer than the CSS opacity transition

/**
 * Full-screen background behind the whole shop: product photos that slowly zoom
 * and cross-fade into each other, under a soft pink wash so text stays readable.
 */
export default function BackgroundStage({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let clear: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setActive((cur) => {
        setLeaving(cur);
        clearTimeout(clear);
        clear = setTimeout(() => setLeaving(null), FADE_MS);
        return (cur + 1) % images.length;
      });
    }, HOLD_MS);

    return () => {
      clearInterval(id);
      clearTimeout(clear);
    };
  }, [images.length]);

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
