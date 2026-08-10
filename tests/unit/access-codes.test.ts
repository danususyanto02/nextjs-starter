import { describe, expect, it } from "vitest";
import { generateFeatureAccessCodes } from "@/lib/rbac/access-codes";

describe("feature access codes", () => {
  it("generates four unique nine-character codes", () => {
    const codes = generateFeatureAccessCodes(12);
    expect(codes).toEqual(["AM0000012", "AD0000012", "ED0000012", "DD0000012"]);
    expect(new Set(codes).size).toBe(4);
  });
});
