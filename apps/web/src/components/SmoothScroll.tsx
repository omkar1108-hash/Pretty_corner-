"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

let lastSegment = 0;
const STEP_SCREENS = 1.5; // change the background picture every ~1.5 screens of scrolling

const MAX_BLUR = 10; // px
const DRIFT = 28; // px

/**
 * Scroll-linked reveal for every element marked `data-fx`:
 * as it nears the top of the screen it blurs, shrinks slightly and fades out;
 * as it comes up from the bottom it sharpens and fades in.
 * Styles are written straight to the element (no React re-render per frame).
 */
function applyFx() {
  const vh = window.innerHeight;

  // Background "dive": zoom in and drift up a little as you travel down the page.
  const bg = document.querySelector<HTMLElement>("[data-bg-zoom]");
  if (bg) {
    const range = Math.max(1, document.documentElement.scrollHeight - vh);
    const t = clamp(window.scrollY / range);
    bg.style.transform = `translate3d(0, ${(-t * 3).toFixed(2)}%, 0) scale(${(1 + t * 0.3).toFixed(4)})`;
  }

  // Scrolling through the page also moves the background to the next / previous picture.
  const segment = Math.floor(window.scrollY / (vh * STEP_SCREENS));
  if (segment !== lastSegment) {
    window.dispatchEvent(new CustomEvent("bg-step", { detail: segment > lastSegment ? 1 : -1 }));
    lastSegment = segment;
  }
  const zone = vh * 0.3;

  document.querySelectorAll<HTMLElement>("[data-fx]").forEach((el) => {
    const r = el.getBoundingClientRect();
    const entering = clamp((vh - r.top) / zone);
    const leaving = clamp(r.bottom / zone);
    const p = smooth(Math.min(entering, leaving));

    if (p > 0.995) {
      // fully visible: remove the styles entirely (also avoids creating stacking contexts)
      if (el.style.opacity) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("filter");
        el.style.removeProperty("transform");
      }
      return;
    }
    const dir = leaving < entering ? -1 : 1;
    el.style.opacity = p.toFixed(3);
    el.style.filter = `blur(${((1 - p) * MAX_BLUR).toFixed(2)}px)`;
    el.style.transform = `translate3d(0, ${((1 - p) * DRIFT * dir).toFixed(1)}px, 0) scale(${(0.97 + 0.03 * p).toFixed(4)})`;
  });
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastSegment = Math.floor(window.scrollY / (window.innerHeight * STEP_SCREENS));
    const lenis = new Lenis({ lerp: 0.09, anchors: true });
    let raf = 0;
    let frame = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyFx);
    };
    lenis.on("scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // pick up cards that appear/disappear when filters change
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
      lenis.destroy();
      mo.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.querySelectorAll<HTMLElement>("[data-fx]").forEach((el) => {
        el.style.opacity = el.style.filter = el.style.transform = "";
      });
      const bg = document.querySelector<HTMLElement>("[data-bg-zoom]");
      if (bg) bg.style.transform = "";
    };
  }, []);

  // new page: start at the top and re-measure once layout settles
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
