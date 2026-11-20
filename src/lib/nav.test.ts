import { describe, expect, it } from "vitest";
import { crumbsFor, isCurrent, sectionOf } from "./nav";

describe("sectionOf", () => {
  it("returns the top-level section a path belongs to", () => {
    expect(sectionOf("/posts/stop-stashing-use-git-worktree/")).toBe("posts");
    expect(sectionOf("/tools/regex")).toBe("tools");
    expect(sectionOf("/tags/")).toBe("tags");
    expect(sectionOf("/search")).toBe("search");
  });

  it("returns null for the home page and pages outside a section", () => {
    expect(sectionOf("/")).toBeNull();
    expect(sectionOf("/404")).toBeNull();
  });

  // A prefix match alone would put /postsfoo under posts.
  it("matches whole segments only", () => {
    expect(sectionOf("/postscript")).toBeNull();
  });
});

describe("isCurrent", () => {
  // Astro serves the same page with and without the trailing slash.
  it("ignores a trailing slash on either side", () => {
    expect(isCurrent("/tools/regex/", "/tools/regex")).toBe(true);
    expect(isCurrent("/tools/regex", "/tools/regex/")).toBe(true);
  });

  it("does not treat a parent as the current page", () => {
    expect(isCurrent("/tools/regex/", "/tools/")).toBe(false);
  });

  it("matches the root", () => {
    expect(isCurrent("/", "/")).toBe(true);
  });
});

describe("crumbsFor", () => {
  it("is empty for the home page", () => {
    expect(crumbsFor("/")).toEqual([]);
  });

  it("links every segment but the last, which is the current page", () => {
    expect(crumbsFor("/tools/regex/")).toEqual([
      { label: "tools", href: "/tools/" },
      { label: "regex" },
    ]);
  });

  it("handles a single segment without a trailing slash", () => {
    expect(crumbsFor("/search")).toEqual([{ label: "search" }]);
  });

  it("decodes percent-encoded segments", () => {
    expect(crumbsFor("/tags/dev%20setup/")).toEqual([
      { label: "tags", href: "/tags/" },
      { label: "dev setup" },
    ]);
  });
});
