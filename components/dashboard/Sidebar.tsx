import Link from "next/link";
import { auth } from "@/auth";
import { getEffectivePermissions } from "@/lib/rbac/permissions";

const items = [["Dashboard", "/dashboard", "AM0000001"], ["Users", "/dashboard/users", "AM0000002"], ["Roles", "/dashboard/roles", "AM0000003"], ["Organizations", "/dashboard/organizations", "AM0000004"], ["Features", "/dashboard/features", "AM0000005"], ["Locked Records", "/dashboard/locked-records", "AM0000006"], ["External API Demo", "/dashboard/external-api-demo", "AM0000007"]] as const;
const icons = ["⌂", "◌", "◇", "▦", "◈", "⊙", "↗"];

export async function Sidebar() {
  const session = await auth();
  const permissionSet = session?.user?.id ? await getEffectivePermissions(session.user.id) : { roleCodes: new Set<string>(), codes: new Set<string>() };
  const isSuperAdmin = permissionSet.roleCodes.has("SUPER_ADMIN");
  const visibleItems = items.filter(([, , code]) => isSuperAdmin || permissionSet.codes.has(code));
  return <>
    <aside className="hidden min-h-screen w-[272px] shrink-0 flex-col border-r border-[#4c4c35] bg-[#3d3d2b] px-5 py-6 text-white lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#8c7355] text-lg font-bold text-white shadow-lg shadow-black/10">N</div>
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Workspace</p><h1 className="text-lg font-bold tracking-tight">Northstar Admin</h1></div>
      </div>
      <div className="my-8 h-px bg-white/10" />
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Navigation</p>
      <nav className="mt-3 space-y-1">{visibleItems.map(([label, href], index) => <Link className="group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white" href={href} key={href}><span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-sm text-[#d6c5a9] transition group-hover:bg-[#8c7355] group-hover:text-white">{icons[index]}</span>{label}</Link>)}</nav>
      <div className="mt-auto rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-xs font-semibold text-white/80">Protected workspace</p><p className="mt-1 text-xs leading-5 text-white/45">Permissions and sessions are enforced server-side.</p><div className="mt-4 flex items-center gap-2 text-xs text-[#b9d7bc]"><span className="h-2 w-2 rounded-full bg-[#73bd8d]" /> System operational</div></div>
    </aside>
    <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[#dedbd2] bg-[#f7f6f2]/95 px-4 py-3 backdrop-blur lg:hidden">{visibleItems.map(([label, href], index) => <Link className="flex shrink-0 items-center gap-2 rounded-lg border border-[#dedbd2] bg-white px-3 py-2 text-xs font-semibold text-[#4d4b43]" href={href} key={href}><span className="text-[#5a5a40]">{icons[index]}</span>{label}</Link>)}</nav>
  </>;
}
