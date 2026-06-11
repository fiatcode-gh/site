import { describe, expect, it } from "vitest";
import { tools } from "../../src/lib/tools/registry";

describe("tools registry", () => {
  it("contains all 8 tools", () => {
    expect(tools).toHaveLength(8);
  });

  it("has unique, url-safe slugs", () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("includes the expected slugs", () => {
    const slugs = tools.map((t) => t.slug).sort();
    expect(slugs).toEqual(
      [
        "base64",
        "cron",
        "exif-stripper",
        "json",
        "jwt",
        "qr",
        "regex",
        "uuid",
      ].sort(),
    );
  });

  it("every tool has a name and a one-line description", () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeLessThanOrEqual(90);
    }
  });
});
