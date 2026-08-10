import { getResource, updateResource, deleteResource } from "@/lib/api/crud"; import { resourceConfigs } from "@/lib/api/resource-config";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) { return getResource(request, (await context.params).id, resourceConfigs.roles); }
export async function PATCH(request: Request, context: Context) { return updateResource(request, (await context.params).id, resourceConfigs.roles); }
export async function DELETE(request: Request, context: Context) { return deleteResource(request, (await context.params).id, resourceConfigs.roles); }
