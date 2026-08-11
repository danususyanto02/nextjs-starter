"use client";

import { Icon } from "@/components/ui/Icon";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="page-shell grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-[9px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center"><span className="empty-state-icon text-[var(--danger)]"><Icon name="warning" /></span><p className="eyebrow mt-4">Unexpected error</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Something went wrong</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Try loading this page again. If issue continues, contact workspace administrator.</p><button className="button button-primary mt-6" onClick={reset}>Try again</button></section></main>;
}
