import type { MarkdownHeading } from "astro";

/**
 * The headings that belong in a post's contents list.
 *
 * This blog writes `##` as the lede — one per post, the thesis sentence
 * that sits directly under the title — and `###` as the real section
 * headings (see AGENTS.md). So the contents list is h3, with h4 as its
 * one level of nesting; h1 and the h2 lede are dropped.
 */
export function filterHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.filter((h) => h.depth === 3 || h.depth === 4);
}

/**
 * Given each heading's distance from the top of the viewport (in document
 * order) and an activation offset, returns the id of the section the reader
 * is currently in: the last heading whose top has crossed the offset line.
 * Returns null when no heading has crossed yet (reader is above the first).
 */
export function activeHeadingId(
  entries: { id: string; top: number }[],
  offset: number,
): string | null {
  let active: string | null = null;
  for (const entry of entries) {
    if (entry.top <= offset) active = entry.id;
  }
  return active;
}
