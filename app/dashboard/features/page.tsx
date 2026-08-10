import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";
import { ResourceCrud } from "@/components/dashboard/ResourceCrud";

export default async function FeaturesPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000005"))) redirect("/dashboard/forbidden");
  return <ResourceCrud resourceType="menuFeature" title="Features" description="Create menu features with atomic AM/AD/ED/DD permissions." endpoint="/api/v1/features" permissions={{ add: "AD0000005", edit: "ED0000005", remove: "DD0000005" }} fields={[{ name: "name", label: "Name", required: true }, { name: "routePath", label: "Route path", required: true }, { name: "icon", label: "Icon" }, { name: "sortOrder", label: "Sort order", type: "number" }, { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"] }, { name: "recordLockEnabled", label: "Record locking enabled", type: "checkbox" }]} columns={[{ key: "name", label: "Name" }, { key: "routePath", label: "Route" }, { key: "sortOrder", label: "Order" }, { key: "recordLockEnabled", label: "Locking" }]} />;
}
