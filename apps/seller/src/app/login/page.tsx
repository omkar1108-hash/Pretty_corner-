"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { SHOP_NAME } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    getSupabase().auth.getSession().then(({ data }) => data.session && router.replace("/"));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      setError("Wrong email or password.");
      setBusy(false);
    } else {
      router.replace("/");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-plum p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-plum text-xl text-gold">★</div>
        <h1 className="mt-4 text-2xl font-bold">{SHOP_NAME} Studio</h1>
        <p className="text-sm text-muted">Sign in to manage your shop</p>

        {!supabaseConfigured && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Supabase isn&apos;t connected yet. Add the keys to <code>.env.local</code> and restart (see README).
          </p>
        )}

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
        <button className="btn btn-primary mt-5 w-full" disabled={busy || !supabaseConfigured}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
