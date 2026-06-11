import { describe, expect, it } from "vitest";
import {
  cleanedFilename,
  summarizeTags,
  targetMime,
} from "../../src/lib/tools/exif";

describe("targetMime", () => {
  it("preserves JPEG, PNG, and WebP", () => {
    expect(targetMime("image/jpeg")).toBe("image/jpeg");
    expect(targetMime("image/png")).toBe("image/png");
    expect(targetMime("image/webp")).toBe("image/webp");
  });

  it("falls back to PNG for anything else", () => {
    expect(targetMime("image/gif")).toBe("image/png");
    expect(targetMime("")).toBe("image/png");
  });
});

describe("cleanedFilename", () => {
  it("swaps the extension for the target format", () => {
    expect(cleanedFilename("photo.jpeg", "image/jpeg")).toBe("photo-clean.jpg");
    expect(cleanedFilename("a.b.c.webp", "image/webp")).toBe(
      "a.b.c-clean.webp",
    );
  });

  it("handles names without an extension", () => {
    expect(cleanedFilename("pic", "image/png")).toBe("pic-clean.png");
  });

  it("never produces an empty base name", () => {
    expect(cleanedFilename(".hidden", "image/png")).toBe("image-clean.png");
  });
});

describe("summarizeTags", () => {
  it("keeps tags with a description and drops empty ones", () => {
    const fields = summarizeTags({
      Make: { description: "Canon" },
      GPSLatitude: { description: "57.7" },
      Missing: undefined,
      Empty: { description: "" },
      NotATag: 42,
    });
    expect(fields).toEqual([
      { name: "Make", description: "Canon" },
      { name: "GPSLatitude", description: "57.7" },
    ]);
  });

  it("stringifies non-string descriptions", () => {
    expect(summarizeTags({ Orientation: { description: 1 } })).toEqual([
      { name: "Orientation", description: "1" },
    ]);
  });

  it("truncates very long descriptions", () => {
    const fields = summarizeTags({
      Notes: { description: "x".repeat(300) },
    });
    expect(fields[0].description.length).toBeLessThanOrEqual(120);
    expect(fields[0].description.endsWith("…")).toBe(true);
  });
});
