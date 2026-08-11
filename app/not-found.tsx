import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return <main className="page-shell grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-[9px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center"><span className="empty-state-icon"><Icon name="empty" /></span><p className="eyebrow mt-4">404</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Page not found</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">This page does not exist or is no longer available.</p><Link className="button button-primary mt-6" href="/">Back to home</Link></section></main>;
}
