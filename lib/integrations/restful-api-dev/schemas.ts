import { z } from "zod";
export const objectSchema = z.object({ id: z.union([z.string(), z.number()]).transform(String), name: z.string(), data: z.record(z.unknown()).optional() });
export const objectListSchema = z.array(objectSchema);
export const objectInputSchema = z.object({ name: z.string().min(1), data: z.record(z.unknown()).optional() });
