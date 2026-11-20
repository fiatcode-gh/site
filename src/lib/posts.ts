/**
 * Pure helpers over blog posts, shared by the pages and the Explorer.
 * Typed structurally so tests need no content collection.
 */
interface Dated {
  data: { date: Date };
}

interface Tagged {
  data: { tags?: string[] };
}

/**
 * Every post is written at +07:00, and frontmatter dates lose their offset
 * once parsed. Format in that zone so a post dated midnight local time does
 * not print as the previous day (or land in the previous year) on a UTC
 * build machine.
 */
const SITE_TIME_ZONE = "Asia/Jakarta";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` in the site's time zone. */
export function isoDate(date: Date): string {
  return ymd.format(date);
}

/** Comparator: newest post first. */
export function newestFirst(a: Dated, b: Dated): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

/**
 * Groups posts by year, newest year first. Posts keep their input order
 * within a year, so pass them already sorted.
 */
export function groupByYear<T extends Dated>(
  posts: T[],
): { year: number; posts: T[] }[] {
  const groups = new Map<number, T[]>();
  for (const post of posts) {
    const year = Number(isoDate(post.data.date).slice(0, 4));
    const group = groups.get(year);
    if (group) group.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, posts]) => ({ year, posts }));
}

/**
 * `[tag, count]` pairs, most used first and alphabetical within a count so
 * the order is stable between builds.
 */
export function tagCounts(posts: Tagged[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(
    ([aName, aCount], [bName, bCount]) =>
      bCount - aCount || aName.localeCompare(bName, "en"),
  );
}
