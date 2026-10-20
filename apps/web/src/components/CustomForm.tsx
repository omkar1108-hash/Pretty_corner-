"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/types";
import { MAX_CUSTOM_IMAGES, STATIONS } from "@/lib/config";
import { supabaseConfigured } from "@/lib/supabase";
import { uploadImage } from "@/lib/image";
import { useT } from "./LanguageProvider";
import ThanksPanel from "./ThanksPanel";

export default function CustomForm({ materials, types }: { materials: Category[]; types: Category[] }) {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [station, setStation] = useState("");
  const [material, setMaterial] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "upload" | "send">("");
  const [waUrl, setWaUrl] = useState("");

  useEffect(() => setError(""), [name, station, description]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((cur) => [...cur, ...Array.from(list).filter((f) => f.type.startsWith("image/"))].slice(0, MAX_CUSTOM_IMAGES));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameRequired);
    if (!station) return setError(t.stationRequired);
    if (!description.trim()) return setError(t.descRequired);

    setError("");
    try {
      let images: string[] = [];
      if (files.length && supabaseConfigured) {
        setBusy("upload");
        images = await Promise.all(files.map((f) => uploadImage("custom-requests", f)));
      }
      setBusy("send");
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "custom", name, station, material, type, budget, description, images }),
      });
      const data = await res.json();
      if (!res.ok || !data.waUrl) throw new Error(data.error);
      setWaUrl(data.waUrl);
    } catch {
      setError(t.somethingWrong);
      setBusy("");
    }
  }

  if (waUrl) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6">
        <ThanksPanel waUrl={waUrl} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">{t.yourName}</label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-station">{t.pickupStation}</label>
          <select id="c-station" className="input" value={station} onChange={(e) => setStation(e.target.value)}>
            <option value="">{t.chooseStation}</option>
            {STATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-material">{t.material}</label>
          <select id="c-material" className="input" value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">{t.anyMaterial}</option>
            {materials.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-type">{t.type}</label>
          <select id="c-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t.anyMaterial}</option>
            {types.map((m) => <option key={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c-budget">{t.budget}</label>
        <input id="c-budget" className="input" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} maxLength={7} />
      </div>

      <div>
        <label className="label" htmlFor="c-desc">{t.customDesc}</label>
        <textarea id="c-desc" className="input min-h-28" placeholder={t.customDescPh} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} />
      </div>

      <div>
        <span className="label">{t.photos} <span className="font-normal">({t.photosHint})</span></span>
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative h-24 w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full rounded-xl object-cover" />
              <button
                type="button"
                aria-label={t.remove}
                onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rose text-sm font-bold leading-6 text-white"
              >
                ×
              </button>
            </div>
          ))}
          {files.length < MAX_CUSTOM_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-rose hover:bg-blush"
            >
              <span className="text-2xl leading-none">+</span>
              {t.addPhotos}
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      <p className="text-xs text-muted">{t.pickupNote}</p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn btn-wa w-full" disabled={Boolean(busy)}>
        {busy === "upload" ? t.uploading : busy === "send" ? t.sending : t.sendRequest}
      </button>
    </form>
  );
}
