import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");
  const displayName = session.user?.name ?? session.user?.username ?? "Administrator";
  return <div className="page-shell flex min-h-screen"><Sidebar /><div className="min-w-0 flex-1"><header className="hidden h-[76px] items-center justify-between border-b border-[#ebe9e4] bg-[#f7f6f2]/90 px-8 backdrop-blur lg:flex"><div><p className="eyebrow">Operations console</p><p className="mt-1 text-sm font-semibold text-[#6b6962]">Manage your workspace with confidence</p></div><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#d9d2c4] text-sm font-bold text-[#3d3d2b]">{displayName.slice(0, 1).toUpperCase()}</div><div><p className="text-sm font-bold text-[#1a1a1a]">{displayName}</p><p className="text-xs text-[#7a7870]">Signed in</p></div></div></header><main className="mx-auto w-full max-w-[1440px] p-5 sm:p-8 lg:p-10">{children}</main></div></div>;
}
