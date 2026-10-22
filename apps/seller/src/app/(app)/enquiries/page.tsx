"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type OrderItem = { product: string; colour?: string; qty: number; price: number };

type Enquiry = {
  id: string;
  kind: "order" | "custom";
  name: string;
  station: string;
  status: "new" | "done";
  details: Record<string, string | number | OrderItem[]>;
  images: string[];
  created_at: string;
};

export default function EnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await getSupabase().from("enquiries").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Enquiry[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(r: Enquiry, status: Enquiry["status"]) {
    await getSupabase().from("enquiries").update({ status }).eq("id", r.id);
    load();
  }

  async function remove(r: Enquiry) {
    if (!confirm("Delete this enquiry?")) return;
    await getSupabase().from("enquiries").delete().eq("id", r.id);
    load();
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Enquiries</h1>
      <p className="text-sm text-muted">Every Buy click and custom request is saved here, in case a message gets missed.</p>

      {rows === null && <p className="mt-6 text-muted">Loading…</p>}
      {rows?.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-muted">Nothing yet.</p>}

      <ul className="mt-4 space-y-3">
        {rows?.map((r) => (
          <li key={r.id} className={`rounded-2xl border bg-white p-4 ${r.status === "new" ? "border-brand" : "border-line opacity-70"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.kind === "custom" ? "bg-gold text-white" : "bg-tint text-brand"}`}>
                  {r.kind === "custom" ? "Custom" : "Order"}
                </span>
                <span className="font-semibold">{r.name}</span>
                <span className="text-sm text-muted">· {r.station}</span>
              </div>
              <time className="text-xs text-muted">{new Date(r.created_at).toLocaleString("en-IN")}</time>
            </div>

            <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {Object.entries(r.details).filter(([k, v]) => k !== "items" && v !== "" && v != null).map(([k, v]) => (
                <div key={k} className={k === "description" ? "sm:col-span-2" : ""}>
                  <dt className="inline capitalize text-muted">{k}: </dt>
                  <dd className="inline whitespace-pre-line">{k === "price" || k === "budget" || k === "total" ? `₹${v}` : String(v)}</dd>
                </div>
              ))}
              {Array.isArray(r.details.items) && (
                <ul className="space-y-0.5 sm:col-span-2">
                  {(r.details.items as OrderItem[]).map((it, i) => (
                    <li key={i}>
                      <b>{it.qty} ×</b> {it.product}
                      {it.colour ? <span className="text-muted"> ({it.colour})</span> : null}
                      <span className="text-muted"> · ₹{it.qty * it.price}</span>
                    </li>
                  ))}
                </ul>
              )}
            </dl>

            {r.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {r.images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-3 text-sm">
              <button className="font-semibold text-brand hover:underline" onClick={() => setStatus(r, r.status === "new" ? "done" : "new")}>
                {r.status === "new" ? "Mark as done" : "Mark as new"}
              </button>
              <button className="text-muted hover:text-red-700" onClick={() => remove(r)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
