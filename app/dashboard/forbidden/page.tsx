import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function ForbiddenPage() {
  return <section className="grid min-h-[60vh] place-items-center"><div className="w-full max-w-md text-center"><span className="empty-state-icon text-[var(--warning)]"><Icon name="lock" /></span><p className="eyebrow mt-4">403 Forbidden</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Access not available</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">You do not have permission to access this feature.</p><Link className="button button-secondary mt-6" href="/dashboard">Back to workspace</Link></div></section>;
}
