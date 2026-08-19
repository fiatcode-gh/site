import type { MarkdownHeading } from "astro";
import { describe, expect, it } from "vitest";
import { activeHeadingId, filterHeadings } from "./toc";

const h = (depth: number, slug: string): MarkdownHeading => ({
  depth,
  slug,
  text: slug,
});

describe("filterHeadings", () => {
  // In this blog `##` is the lede — one per post, the thesis sentence —
  // and `###` are the real sections. The contents list is sections, so h2
  // is dropped along with h1.
  it("keeps only h3 and h4, dropping h1 and the h2 lede", () => {
    const input = [h(1, "title"), h(2, "lede"), h(3, "section"), h(4, "sub")];
    expect(filterHeadings(input)).toEqual([h(3, "section"), h(4, "sub")]);
  });

  it("preserves document order", () => {
    const input = [h(3, "a"), h(4, "b"), h(3, "c")];
    expect(filterHeadings(input).map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for empty input", () => {
    expect(filterHeadings([])).toEqual([]);
  });

  it("returns an empty array when nothing qualifies", () => {
    expect(filterHeadings([h(1, "title"), h(2, "lede")])).toEqual([]);
  });
});

describe("activeHeadingId", () => {
  const offset = 100;

  it("returns null when every heading is still below the line (reader above the first heading)", () => {
    const entries = [
      { id: "a", top: 250 },
      { id: "b", top: 600 },
    ];
    expect(activeHeadingId(entries, offset)).toBeNull();
  });

  it("returns the last heading that has crossed the line (current section persists between headings)", () => {
    // 'a' is above the line (top <= offset), 'b' has not reached it yet.
    const entries = [
      { id: "a", top: -120 },
      { id: "b", top: 480 },
    ];
    expect(activeHeadingId(entries, offset)).toBe("a");
  });

  it("returns the deepest crossed heading when several have passed", () => {
    const entries = [
      { id: "a", top: -500 },
      { id: "b", top: -200 },
      { id: "c", top: 40 },
      { id: "d", top: 700 },
    ];
    expect(activeHeadingId(entries, offset)).toBe("c");
  });

  it("treats a heading exactly on the line as crossed", () => {
    expect(activeHeadingId([{ id: "a", top: 100 }], offset)).toBe("a");
  });

  it("returns the last heading when all have scrolled past", () => {
    const entries = [
      { id: "a", top: -900 },
      { id: "b", top: -400 },
    ];
    expect(activeHeadingId(entries, offset)).toBe("b");
  });

  it("returns null for no entries", () => {
    expect(activeHeadingId([], offset)).toBeNull();
  });
});
