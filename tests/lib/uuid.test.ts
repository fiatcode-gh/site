import { describe, expect, it } from "vitest";
import { generateUuids } from "../../src/lib/tools/uuid";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuids", () => {
  it("generates N distinct v4 UUIDs", () => {
    const ids = generateUuids(5);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    for (const id of ids) expect(id).toMatch(UUID_V4_RE);
  });

  it("rejects out-of-range counts", () => {
    expect(() => generateUuids(0)).toThrow();
    expect(() => generateUuids(1001)).toThrow();
  });
});
