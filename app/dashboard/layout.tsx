import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Icon } from "@/components/ui/Icon";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");
  const displayName = session.user?.name ?? session.user?.username ?? "Administrator";
  return <div className="page-shell flex min-h-screen"><Sidebar /><div className="min-w-0 flex-1"><header className="hidden h-[60px] items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-8 lg:flex"><div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span>Northstar Admin</span><span aria-hidden="true">/</span><span>Workspace</span></div><div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#e6eee9] text-xs font-semibold text-[var(--primary-deep)]">{displayName.slice(0, 1).toUpperCase()}</div><div><p className="text-xs font-semibold text-[var(--body)]">{displayName}</p><p className="text-[10px] text-[var(--muted)]">Signed in</p></div></div></header><main className="mx-auto w-full max-w-[1280px] p-5 sm:p-8 lg:p-10">{children}</main></div></div>;
}
