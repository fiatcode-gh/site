const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_DESCRIPTION = 120;

export interface MetadataField {
  name: string;
  description: string;
}

export function targetMime(sourceMime: string): string {
  return sourceMime in EXTENSIONS ? sourceMime : "image/png";
}

export function cleanedFilename(original: string, mime: string): string {
  const base = original.replace(/\.[^.]*$/, "") || "image";
  return `${base}-clean.${EXTENSIONS[mime] ?? "png"}`;
}

export function summarizeTags(tags: Record<string, unknown>): MetadataField[] {
  const fields: MetadataField[] = [];
  for (const [name, tag] of Object.entries(tags)) {
    if (tag === null || typeof tag !== "object" || !("description" in tag)) {
      continue;
    }
    let description = String(
      (tag as { description: unknown }).description ?? "",
    ).trim();
    if (description === "") continue;
    if (description.length > MAX_DESCRIPTION) {
      description = description.slice(0, MAX_DESCRIPTION - 1) + "…";
    }
    fields.push({ name, description });
  }
  return fields;
}
