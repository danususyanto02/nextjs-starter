import { describe, expect, it } from "vitest";
import { parseListQuery } from "@/lib/api/pagination";

describe("list query pagination", () => {
  const allowedSorts = ["name", "createdAt"] as const;
  const defaults = { sortBy: "createdAt", sortDirection: "desc" as const };

  it("uses pagination defaults", async () => {
    const result = parseListQuery(new Request("http://localhost/api/v1/roles"), allowedSorts, defaults);
    expect("data" in result && result.data).toEqual({ limit: 25, offset: 0, search: "", sortBy: "createdAt", sortDirection: "desc" });
  });

  it("parses valid list parameters", async () => {
    const result = parseListQuery(new Request("http://localhost/api/v1/roles?limit=50&offset=100&search=admin&sortBy=name&sortDirection=asc"), allowedSorts, defaults);
    expect("data" in result && result.data).toEqual({ limit: 50, offset: 100, search: "admin", sortBy: "name", sortDirection: "asc" });
  });

  it("rejects invalid page bounds and sorting", async () => {
    const invalidLimit = parseListQuery(new Request("http://localhost/api/v1/roles?limit=101"), allowedSorts, defaults);
    const invalidSort = parseListQuery(new Request("http://localhost/api/v1/roles?sortBy=passwordHash"), allowedSorts, defaults);
    expect("response" in invalidLimit).toBe(true);
    expect("response" in invalidSort).toBe(true);
  });
});
