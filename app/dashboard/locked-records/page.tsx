import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { LockedRecordsCrud } from "@/components/dashboard/LockedRecordsCrud";

export default async function LockedRecordsPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000006"))) redirect("/dashboard/forbidden");
  return <LockedRecordsCrud />;
}
