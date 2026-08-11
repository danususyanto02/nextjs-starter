"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type NavigationItem = {
  label: string;
  href: string;
  icon: "home" | "people" | "role" | "organization" | "settings" | "lock" | "api";
};

export function SidebarNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Workspace navigation" className="mt-5 hidden space-y-0.5 lg:block">
        {items.map((item) => {
          const active = pathname === item.href;
          return <Link aria-current={active ? "page" : undefined} className={`sidebar-link ${active ? "sidebar-link-active" : ""}`} href={item.href} key={item.href}><Icon name={item.icon} />{item.label}</Link>;
        })}
      </nav>
      <nav aria-label="Workspace navigation" className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[var(--line)] bg-[var(--canvas)]/95 px-4 py-3 backdrop-blur lg:hidden">
        {items.map((item) => {
          const active = pathname === item.href;
          return <Link aria-current={active ? "page" : undefined} className="mobile-link" href={item.href} key={item.href}><Icon name={item.icon} />{item.label}</Link>;
        })}
      </nav>
    </>
  );
}
