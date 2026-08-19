import { describe, expect, it } from "vitest";
import { matchPosts, type SearchDoc } from "./search";

const doc = (
  title: string,
  description = "",
  tags: string[] = [],
): SearchDoc => ({
  id: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  description,
  tags,
});

const docs: SearchDoc[] = [
  doc("Docker vs Podman", "The daemon was never the feature", [
    "podman",
    "linux",
  ]),
  doc("Stop Stashing. Use Git Worktree.", "Switching branches is cheap", [
    "git",
  ]),
  doc("Vibe Coding Still Needs a Craftsman", "AI writes fast, not well", [
    "ai",
    "craftsmanship",
  ]),
];

describe("matchPosts", () => {
  it("returns every doc for an empty or whitespace query", () => {
    // arrange / act / assert
    expect(matchPosts(docs, "")).toHaveLength(3);
    expect(matchPosts(docs, "   ")).toHaveLength(3);
  });

  it("matches on the title", () => {
    expect(matchPosts(docs, "podman").map((d) => d.title)).toEqual([
      "Docker vs Podman",
    ]);
  });

  it("matches on the description", () => {
    expect(matchPosts(docs, "daemon").map((d) => d.title)).toEqual([
      "Docker vs Podman",
    ]);
  });

  it("matches on a tag", () => {
    expect(matchPosts(docs, "craftsmanship").map((d) => d.title)).toEqual([
      "Vibe Coding Still Needs a Craftsman",
    ]);
  });

  it("ignores case", () => {
    expect(matchPosts(docs, "PODMAN")).toHaveLength(1);
    expect(matchPosts(docs, "PoDmAn")).toHaveLength(1);
  });

  it("requires every term to match, not just one", () => {
    // "podman" hits doc 1, "git" hits doc 2 — nothing has both.
    expect(matchPosts(docs, "podman git")).toEqual([]);
    // Both terms live in doc 1.
    expect(matchPosts(docs, "podman daemon").map((d) => d.title)).toEqual([
      "Docker vs Podman",
    ]);
  });

  it("tolerates extra whitespace between terms", () => {
    expect(matchPosts(docs, "  podman   daemon  ")).toHaveLength(1);
  });

  it("matches partial words so typing narrows as you go", () => {
    expect(matchPosts(docs, "craft")).toHaveLength(1);
    expect(matchPosts(docs, "dock")).toHaveLength(1);
  });

  it("returns an empty array when nothing matches", () => {
    expect(matchPosts(docs, "kubernetes")).toEqual([]);
  });

  it("preserves the input order of the docs", () => {
    // "s" appears in all three; order must be unchanged.
    expect(matchPosts(docs, "s").map((d) => d.id)).toEqual(
      docs.map((d) => d.id),
    );
  });
});
