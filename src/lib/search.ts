/**
 * Client-side post search.
 *
 * The index is built at build time and shipped with the page, so the
 * whole thing runs in the tab — no query ever leaves the browser, which
 * is what the copy on /search promises.
 *
 * Matching is deliberately plain: lowercase substring, every term
 * required. No stemming or fuzzy scoring — with a couple of dozen posts
 * across title, description and tags, anything cleverer mostly produces
 * surprises.
 */
export interface SearchDoc {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

const haystack = (doc: SearchDoc): string =>
  `${doc.title} ${doc.description} ${doc.tags.join(" ")}`.toLowerCase();

export function matchPosts(docs: SearchDoc[], query: string): SearchDoc[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return docs;

  return docs.filter((doc) => {
    const text = haystack(doc);
    return terms.every((term) => text.includes(term));
  });
}
