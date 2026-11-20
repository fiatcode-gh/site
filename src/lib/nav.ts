/** The sections that own a title-bar tab. */
export const sections = ["posts", "tools", "tags", "search"] as const;

export type Section = (typeof sections)[number];

/** One breadcrumb after the site root. No `href` means the current page. */
export interface Crumb {
  label: string;
  href?: string;
}

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** The section a path lives in, by its first segment; null outside one. */
export function sectionOf(pathname: string): Section | null {
  const first = segments(pathname)[0];
  return sections.find((s) => s === first) ?? null;
}

/** Whether `href` is the page at `pathname`, ignoring trailing slashes. */
export function isCurrent(pathname: string, href: string): boolean {
  return segments(pathname).join("/") === segments(href).join("/");
}

/**
 * Breadcrumbs mirroring the URL: every segment links to its own path except
 * the last, which is the current page. Pages with a better trail (a post's
 * year, a paginated listing) pass their own instead.
 */
export function crumbsFor(pathname: string): Crumb[] {
  const parts = segments(pathname).map(decodeURIComponent);
  return parts.map((label, i) =>
    i === parts.length - 1
      ? { label }
      : { label, href: `/${parts.slice(0, i + 1).join("/")}/` },
  );
}
