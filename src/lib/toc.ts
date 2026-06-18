import type { MarkdownHeading } from "astro";

export function filterHeadings(
  headings: MarkdownHeading[],
): MarkdownHeading[] {
  return headings.filter((h) => h.depth === 2 || h.depth === 3);
}
