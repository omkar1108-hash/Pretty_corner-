"use client";

import { useEffect } from "react";
import { useT } from "./LanguageProvider";

/** Confirmation shown right before the buyer is sent to WhatsApp. */
export default function ThanksPanel({ waUrl }: { waUrl: string }) {
  const t = useT();

  useEffect(() => {
    const id = setTimeout(() => {
      window.location.href = waUrl;
    }, 1800);
    return () => clearTimeout(id);
  }, [waUrl]);

  return (
    <div className="py-4 text-center">
      <div className="text-5xl">💖</div>
      <h2 className="mt-2 font-display text-2xl font-bold text-rose">{t.thanksTitle}</h2>
      <p className="mt-2">{t.thanksBody}</p>
      <p className="mt-4 text-sm text-muted">{t.opening}</p>
      <p className="mt-1 text-sm text-muted">{t.thanksWa}</p>
      <a href={waUrl} className="btn btn-wa mt-3">{t.openWa}</a>
    </div>
  );
}
