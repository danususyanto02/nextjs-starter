"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { username: form.get("username"), password: form.get("password"), redirect: false, callbackUrl: "/dashboard" });
    if (result?.error) setError("Invalid username or password"); else window.location.assign("/dashboard");
  }
  return <main className="page-shell grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]"><section className="hidden border-r border-[var(--line)] bg-[var(--surface-muted)] p-10 lg:flex lg:flex-col lg:justify-between"><a className="flex items-center gap-2.5" href="/"><span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--primary)] text-sm font-bold text-white">N</span><span className="text-sm font-semibold">Northstar Admin</span></a><div className="max-w-sm"><div className="page-icon"><Icon name="lock" /></div><p className="eyebrow mt-6">Secure sign in</p><h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.05em]">Make space for better decisions.</h1><p className="mt-4 leading-7 text-[var(--muted)]">Manage people, access, integrations, and records from one focused workspace.</p></div><p className="text-xs text-[var(--muted)]">Secure operations workspace · v0.1</p></section><section className="flex items-center justify-center p-5 sm:p-8"><form className="w-full max-w-[390px] rounded-[9px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_10px_24px_rgba(35,35,35,0.04)] sm:p-8" onSubmit={submit}><a className="flex items-center gap-2.5 lg:hidden" href="/"><span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--primary)] text-sm font-bold text-white">N</span><span className="text-sm font-semibold">Northstar Admin</span></a><p className="eyebrow mt-8 lg:mt-0">Secure sign in</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Welcome back.</h1><p className="mt-2 text-sm text-[var(--muted)]">Use your workspace credentials to continue.</p><div className="mt-7 space-y-4"><label className="grid gap-1.5 text-sm font-semibold">Username<input className="input-base" name="username" placeholder="Enter username" required /></label><label className="grid gap-1.5 text-sm font-semibold">Password<input className="input-base" name="password" placeholder="Enter password" required type="password" /></label>{error && <p className="notice notice-error" role="alert"><Icon name="warning" />{error}</p>}<button className="button button-primary w-full" type="submit">Sign in to workspace <Icon name="chevron-right" /></button></div><p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Your session is protected with HttpOnly cookies.</p></form></section></main>;
}
