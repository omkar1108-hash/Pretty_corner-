"use client";

import { useT } from "./LanguageProvider";

export default function CustomIntro() {
  const t = useT();
  return (
    <div data-fx className="mb-6 text-center">
      <h1 className="font-display text-3xl font-bold italic text-rose sm:text-4xl">{t.customTitle}</h1>
      <p className="mx-auto mt-2 max-w-lg text-muted">{t.customIntro}</p>
    </div>
  );
}
