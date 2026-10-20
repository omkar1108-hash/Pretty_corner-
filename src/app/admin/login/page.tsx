"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { SHOP_NAME } from "@/lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError("Wrong email or password.");
    setBusy(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h1 className="font-display text-3xl font-bold italic text-rose">{SHOP_NAME}</h1>
        <p className="mt-1 text-sm text-muted">Seller login</p>
        <div className="mt-5 space-y-3">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
      </form>
    </div>
  );
}
