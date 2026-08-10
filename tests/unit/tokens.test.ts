import { describe, expect, it } from "vitest";
import { hashOpaqueToken } from "@/lib/auth/tokens";
describe("opaque tokens", () => { it("hashes deterministically and never returns input", () => { const input = "opaque-token"; expect(hashOpaqueToken(input)).not.toBe(input); expect(hashOpaqueToken(input)).toBe(hashOpaqueToken(input)); }); });
