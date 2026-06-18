import { describe, expect, it } from "vitest";
import type { MarkdownHeading } from "astro";
import { filterHeadings } from "./toc";

const h = (depth: number, slug: string): MarkdownHeading => ({
  depth,
  slug,
  text: slug,
});

describe("filterHeadings", () => {
  it("keeps only h2 and h3, dropping h1 and h4+", () => {
    const input = [h(1, "title"), h(2, "intro"), h(3, "detail"), h(4, "aside")];
    expect(filterHeadings(input)).toEqual([h(2, "intro"), h(3, "detail")]);
  });

  it("preserves document order", () => {
    const input = [h(3, "a"), h(2, "b"), h(3, "c")];
    expect(filterHeadings(input).map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for empty input", () => {
    expect(filterHeadings([])).toEqual([]);
  });

  it("returns an empty array when nothing qualifies", () => {
    expect(filterHeadings([h(1, "title"), h(4, "aside")])).toEqual([]);
  });
});
