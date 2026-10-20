"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

const STEP_SCREENS = 1.5; // change the background picture every ~1.5 screens of scrolling
let lastSegment = 0;

/** Moves the background to the next / previous picture as you scroll through the page. */
function trackBackgroundStep() {
  const segment = Math.floor(window.scrollY / (window.innerHeight * STEP_SCREENS));
  if (segment !== lastSegment) {
    window.dispatchEvent(new CustomEvent("bg-step", { detail: segment > lastSegment ? 1 : -1 }));
    lastSegment = segment;
  }
}

/**
 * Fallback for browsers without CSS scroll-driven animations (see globals.css).
 * Same look: elements marked `data-fx` start small + faded as they come up from the
 * bottom, grow to full size, then shrink + fade as they leave at the top.
 * All layout reads happen first, then all writes, so it never forces a re-layout.
 */
function applyFxFallback() {
  const vh = window.innerHeight;
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-fx]"));
  const rects = els.map((el) => el.getBoundingClientRect());

  els.forEach((el, i) => {
    const { top, bottom, height } = rects[i];
    const span = Math.max(1, Math.min(height, vh));
    const enter = clamp((vh - top) / span);
    const leave = clamp((span - bottom) / span);
    const p = smooth(1 - Math.max(1 - enter, leave));

    if (p > 0.995) {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      el.style.removeProperty("filter");
      return;
    }
    const dir = leave > 1 - enter ? -1 : 1;
    el.style.opacity = p.toFixed(3);
    el.style.transform = `translate3d(0, ${((1 - p) * 56 * dir).toFixed(1)}px, 0) scale(${(0.55 + 0.45 * p).toFixed(4)})`;
    if (el.dataset.fx === "blur") el.style.filter = `blur(${((1 - p) * 10).toFixed(1)}px)`;
  });

  const bg = document.querySelector<HTMLElement>("[data-bg-zoom]");
  if (bg) {
    const t = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh));
    bg.style.transform = `translate3d(0, ${(-t * 3).toFixed(2)}%, 0) scale(${(1 + t * 0.3).toFixed(4)})`;
  }
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Chrome/Edge/Android/Safari 26+: the CSS does the animating, JS only smooths the wheel.
    const native = CSS.supports("animation-timeline", "view()");

    lastSegment = Math.floor(window.scrollY / (window.innerHeight * STEP_SCREENS));
    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    let raf = 0;
    let frame = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onScroll = () => {
      trackBackgroundStep();
      if (!native) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(applyFxFallback);
      }
    };
    lenis.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    let mo: MutationObserver | undefined;
    if (!native) {
      window.addEventListener("resize", onScroll);
      mo = new MutationObserver(onScroll); // cards appear/disappear when filters change
      mo.observe(document.body, { childList: true, subtree: true });
      onScroll();
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
      lenis.destroy();
      mo?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.querySelectorAll<HTMLElement>("[data-fx]").forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
        el.style.removeProperty("filter");
      });
      document.querySelector<HTMLElement>("[data-bg-zoom]")?.style.removeProperty("transform");
    };
  }, []);

  // new page: re-measure once layout settles
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
