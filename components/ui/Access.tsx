import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
export async function Access({ CodeAccess, children }: { CodeAccess: string; children: React.ReactNode }) { const session = await auth(); if (!session?.user?.id || !(await hasAccess(session.user.id, CodeAccess))) return null; return children; }
