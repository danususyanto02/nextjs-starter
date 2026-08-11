import { z } from "zod";
import { error } from "@/lib/api/response";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(100).default(""),
  sortBy: z.string().trim().max(64).default(""),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export function parseListQuery(request: Request, allowedSorts: readonly string[], defaults: { sortBy: string; sortDirection: "asc" | "desc" }) {
  const url = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    sortBy: url.searchParams.get("sortBy") || defaults.sortBy,
    sortDirection: url.searchParams.get("sortDirection") || defaults.sortDirection
  });
  if (!parsed.success) return { response: error("VALIDATION_ERROR", "Invalid list query", 422, parsed.error.flatten()) } as const;
  if (!allowedSorts.includes(parsed.data.sortBy)) return { response: error("VALIDATION_ERROR", "Invalid sort field", 422, { field: "sortBy", allowed: allowedSorts }) } as const;
  return { data: parsed.data } as const;
}

export type PageMeta = { limit: number; offset: number; total: number };

