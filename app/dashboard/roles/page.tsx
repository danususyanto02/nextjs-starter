import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { ResourceCrud } from "@/components/dashboard/ResourceCrud";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000003"))) redirect("/dashboard/forbidden");
  return <ResourceCrud resourceType="role" title="Roles" description="Manage roles and permission assignments." endpoint="/api/v1/roles" permissions={{ add: "AD0000003", edit: "ED0000003", remove: "DD0000003" }} fields={[{ name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }, { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"] }]} columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} />;
}
