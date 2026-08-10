import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { ResourceCrud } from "@/components/dashboard/ResourceCrud";

export default async function OrganizationsPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000004"))) redirect("/dashboard/forbidden");
  return <ResourceCrud resourceType="organization" title="Organizations" description="Manage organizations, roles, and members." endpoint="/api/v1/organizations" permissions={{ add: "AD0000004", edit: "ED0000004", remove: "DD0000004" }} fields={[{ name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }, { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"] }]} columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} />;
}
