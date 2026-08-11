export default function Loading() {
  return <main aria-busy="true" aria-live="polite" className="page-shell p-5 sm:p-8"><span className="sr-only">Loading page</span><div className="mx-auto max-w-[900px] space-y-6"><div className="space-y-3 border-b border-[var(--line)] pb-6"><div className="skeleton h-9 w-9" /><div className="skeleton h-8 w-56" /><div className="skeleton h-4 w-full max-w-md" /></div><div className="grid gap-3 sm:grid-cols-2"><div className="skeleton h-28" /><div className="skeleton h-28" /></div><div className="skeleton h-52" /></div></main>;
}
