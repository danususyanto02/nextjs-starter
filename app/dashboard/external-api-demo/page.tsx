import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasAccess } from "@/lib/rbac/permissions";
import { ExternalApiCrud } from "@/components/dashboard/ExternalApiCrud";

export default async function ExternalApiDemoPage() {
  const session = await auth();
  if (!session?.user?.id || !(await hasAccess(session.user.id, "AM0000007"))) redirect("/dashboard/forbidden");
  return <ExternalApiCrud />;
}
