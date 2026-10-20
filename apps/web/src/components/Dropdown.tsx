"use client";

import { Children, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";

type Opt = { value: string; label: string };

const text = (n: ReactNode): string =>
  Children.toArray(n)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : ""))
    .join("");

/** Reads plain <option> children, so call sites keep their existing option lists. */
function readOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.toArray(children).forEach((c) => {
    if (!isValidElement(c) || c.type !== "option") return;
    const el = c as ReactElement<{ value?: string | number; children?: ReactNode }>;
    const label = text(el.props.children);
    out.push({ value: el.props.value !== undefined ? String(el.props.value) : label, label });
  });
  return out;
}

/**
 * A styled replacement for <select>: the browser's own option list can't be themed
 * (it shows the ugly blue list). Same idea: pass <option>s as children.
 * The list is drawn in a portal with fixed positioning so it never gets clipped by
 * modals or scroll-animated parents.
 */
export default function Dropdown({
  id,
  value,
  onChange,
  children,
  className = "input",
  align = "left",
  label,
  prefix,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
  label?: string;
  /** small muted name shown inside the button, e.g. "Material: All" */
  prefix?: string;
}) {
  const options = useMemo(() => readOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; maxH: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const isPlaceholder = !selected || selected.value === "";

  const place = useCallback(() => {
    const el = btn.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(r.width, 170), vw - 16);
    let left = align === "right" ? r.right - width : r.left;
    left = Math.max(8, Math.min(left, vw - width - 8));
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    if (below >= 220 || below >= above) setPos({ top: r.bottom + 6, left, width, maxH: Math.min(300, below - 6) });
    else setPos({ bottom: vh - r.top + 6, left, width, maxH: Math.min(300, above - 6) });
  }, [align]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    place();
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    btn.current?.focus();
  };

  // close on outside click, resize, or page scroll
  useEffect(() => {
    if (!open) return;
    const down = (e: Event) => {
      const t = e.target as Node;
      if (!list.current?.contains(t) && !btn.current?.contains(t)) close();
    };
    const scroll = (e: Event) => {
      if (!list.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", down);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open, close]);

  // keep the highlighted row in view
  useLayoutEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, pos]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close();
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (options[active]) pick(options[active].value); }
  };

  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
        className={`${className} flex cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${isPlaceholder && selected?.value === "" && !prefix ? "text-muted" : ""}`}>
          {prefix && <span className="text-muted">{prefix}: </span>}
          {selected?.label ?? ""}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-rose transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={list}
            data-lenis-prevent
            role="listbox"
            style={{ position: "fixed", top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxH }}
            className="dropdown-pop z-[100] overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-xl shadow-rose/15"
          >
            {options.map((o, i) => {
              const sel = o.value === value;
              return (
                <div
                  key={o.value + i}
                  data-i={i}
                  role="option"
                  aria-selected={sel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] ${
                    i === active ? "bg-blush" : ""
                  } ${sel ? "font-semibold text-rose" : o.value === "" ? "text-muted" : "text-ink"}`}
                >
                  <span>{o.label}</span>
                  {sel && (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
