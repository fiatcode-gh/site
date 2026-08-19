export interface ToolEntry {
  slug: string;
  name: string;
  description: string;
  /** Condensed line for the home page's four-column tool strip. */
  short: string;
}

export const tools: ToolEntry[] = [
  {
    slug: "base64",
    name: "Base64",
    description:
      "Encode and decode Base64 — UTF-8 safe, URL-safe variant, file input.",
    short: "UTF-8 safe, URL-safe, file input.",
  },
  {
    slug: "json",
    name: "JSON formatter",
    description:
      "Pretty-print, validate, and minify JSON with precise error locations.",
    short: "Pretty-print, validate, minify.",
  },
  {
    slug: "uuid",
    name: "UUID / ULID",
    description: "Generate UUID v4 and ULID identifiers, one or in bulk.",
    short: "UUID v4 and ULID, in bulk.",
  },
  {
    slug: "jwt",
    name: "JWT decoder",
    description:
      "Decode JWT header and payload locally. Decoding is not verification.",
    short: "Decode header and payload locally.",
  },
  {
    slug: "regex",
    name: "Regex tester",
    description:
      "Live match highlighting, capture groups, flags, and replace preview.",
    short: "Live matches, groups, replace.",
  },
  {
    slug: "exif-stripper",
    name: "EXIF stripper",
    description:
      "See and strip image metadata (EXIF, GPS) — download a clean copy.",
    short: "See and strip EXIF and GPS data.",
  },
  {
    slug: "cron",
    name: "Cron explainer",
    description:
      "Turn a cron expression into plain language and its next run times.",
    short: "Plain language and next run times.",
  },
  {
    slug: "qr",
    name: "QR generator",
    description: "Create QR codes from text or URLs, download as SVG or PNG.",
    short: "From text or URLs, SVG or PNG.",
  },
];
