import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
describe("rate limiter disabled mode", () => { it("allows all requests without database state", async () => { const result = await checkRateLimit("test", 1, 60, false); expect(result.allowed).toBe(true); expect(result.remaining).toBe(1); }); });
