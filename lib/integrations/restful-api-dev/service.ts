import { z } from "zod";
import { restfulApiDevClient } from "@/lib/integrations/restful-api-dev/client";
export const externalObjectInput = z.object({ name: z.string().min(1).max(200), data: z.record(z.unknown()).optional() });
export const externalService = { list: () => restfulApiDevClient.list(), get: (id: string) => restfulApiDevClient.get(id), create: (input: unknown) => restfulApiDevClient.create(externalObjectInput.parse(input)), update: (id: string, input: unknown, method: "PUT" | "PATCH" = "PUT") => restfulApiDevClient.update(id, externalObjectInput.parse(input), method), remove: (id: string) => restfulApiDevClient.remove(id) };
