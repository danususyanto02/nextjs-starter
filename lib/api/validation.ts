import { z } from "zod";
import { error } from "@/lib/api/response";

export async function parseJson<T extends z.ZodType>(request: Request, schema: T): Promise<{ data: z.infer<T> } | { response: Response }> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  return parsed.success ? { data: parsed.data } : { response: error("VALIDATION_ERROR", "Request validation failed", 422, parsed.error.flatten()) };
}
