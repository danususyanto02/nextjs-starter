import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { ResourceCrud } from "@/components/dashboard/ResourceCrud";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000002"))) redirect("/dashboard/forbidden");
  return <ResourceCrud resourceType="user" assignment={{ label: "Roles", endpointSuffix: "roles", permission: "ED0000002", payloadKey: "roleIds" }} title="Users" description="Manage users, status, and direct roles." endpoint="/api/v1/users" permissions={{ add: "AD0000002", edit: "ED0000002", remove: "DD0000002" }} fields={[{ name: "username", label: "Username", required: true, minLength: 3 }, { name: "password", label: "Password", type: "password", required: true, minLength: 8 }, { name: "displayName", label: "Display name" }, { name: "email", label: "Email", type: "email" }, { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"] }]} columns={[{ key: "username", label: "Username" }, { key: "displayName", label: "Display name" }, { key: "email", label: "Email" }, { key: "status", label: "Status" }]} />;
}
