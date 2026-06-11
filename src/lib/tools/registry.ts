export interface ToolEntry {
  slug: string;
  name: string;
  description: string;
}

export const tools: ToolEntry[] = [
  {
    slug: "base64",
    name: "Base64",
    description:
      "Encode and decode Base64 — UTF-8 safe, URL-safe variant, file input.",
  },
  {
    slug: "json",
    name: "JSON formatter",
    description:
      "Pretty-print, validate, and minify JSON with precise error locations.",
  },
  {
    slug: "uuid",
    name: "UUID / ULID",
    description: "Generate UUID v4 and ULID identifiers, one or in bulk.",
  },
  {
    slug: "jwt",
    name: "JWT decoder",
    description:
      "Decode JWT header and payload locally. Decoding is not verification.",
  },
  {
    slug: "regex",
    name: "Regex tester",
    description:
      "Live match highlighting, capture groups, flags, and replace preview.",
  },
  {
    slug: "exif-stripper",
    name: "EXIF stripper",
    description:
      "See and strip image metadata (EXIF, GPS) — download a clean copy.",
  },
  {
    slug: "cron",
    name: "Cron explainer",
    description:
      "Turn a cron expression into plain language and its next run times.",
  },
  {
    slug: "qr",
    name: "QR generator",
    description: "Create QR codes from text or URLs, download as SVG or PNG.",
  },
];
