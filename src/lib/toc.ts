import type { MarkdownHeading } from "astro";

export function filterHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.filter((h) => h.depth === 2 || h.depth === 3);
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
