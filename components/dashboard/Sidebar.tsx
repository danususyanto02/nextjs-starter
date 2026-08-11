import { auth } from "@/auth";
import { Icon } from "@/components/ui/Icon";
import { getEffectivePermissions } from "@/lib/rbac/permissions";
import { SidebarNavigation } from "@/components/dashboard/SidebarNavigation";

const items = [
  { label: "Dashboard", href: "/dashboard", permission: "AM0000001", icon: "home" },
  { label: "Users", href: "/dashboard/users", permission: "AM0000002", icon: "people" },
  { label: "Roles", href: "/dashboard/roles", permission: "AM0000003", icon: "role" },
  { label: "Organizations", href: "/dashboard/organizations", permission: "AM0000004", icon: "organization" },
  { label: "Features", href: "/dashboard/features", permission: "AM0000005", icon: "settings" },
  { label: "Locked Records", href: "/dashboard/locked-records", permission: "AM0000006", icon: "lock" },
  { label: "External API Demo", href: "/dashboard/external-api-demo", permission: "AM0000007", icon: "api" }
] as const;

export async function Sidebar() {
  const session = await auth();
  const permissionSet = session?.user?.id ? await getEffectivePermissions(session.user.id) : { roleCodes: new Set<string>(), codes: new Set<string>() };
  const isSuperAdmin = permissionSet.roleCodes.has("SUPER_ADMIN");
  const visibleItems = items.filter((item) => isSuperAdmin || permissionSet.codes.has(item.permission)).map(({ permission: _permission, ...item }) => item);

  return <>
    <aside className="hidden min-h-screen w-[244px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-3 py-4 lg:flex">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="grid h-8 w-8 place-items-center rounded-[6px] bg-[var(--primary)] text-sm font-bold text-white">N</div>
        <div><p className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">Northstar Admin</p><p className="text-[11px] text-[var(--muted)]">Operations workspace</p></div>
      </div>
      <div className="mt-7 px-2 text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--subtle)]">Workspace</div>
      <SidebarNavigation items={visibleItems} />
      <div className="mt-auto border-t border-[var(--line)] px-2 pt-4">
        <div className="rounded-[6px] bg-[var(--surface-muted)] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--body)]"><Icon className="text-[var(--success)]" name="check" />Protected workspace</div>
          <p className="mt-1.5 text-[11px] leading-4 text-[var(--muted)]">Permissions and sessions stay enforced server-side.</p>
        </div>
      </div>
    </aside>
    <div className="lg:hidden"><SidebarNavigation items={visibleItems} /></div>
  </>;
}
