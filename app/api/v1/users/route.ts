import { listResource, createResource } from "@/lib/api/crud"; import { resourceConfigs } from "@/lib/api/resource-config";
export const GET = (request: Request) => listResource(request, resourceConfigs.users); export const POST = (request: Request) => createResource(request, resourceConfigs.users);
