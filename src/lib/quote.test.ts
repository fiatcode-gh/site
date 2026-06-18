import { afterEach, describe, expect, it, vi } from "vitest";
import quotes from "../data/quotes.json";
import { getQuote } from "./quote";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getQuote", () => {
  it("returns the first quote when Math.random is 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(getQuote()).toEqual(quotes[0]);
  });

  it("returns the last quote when Math.random approaches 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(getQuote()).toEqual(quotes[quotes.length - 1]);
  });

  it("returns an entry from the dataset with non-empty fields", () => {
    const result = getQuote();
    expect(quotes).toContainEqual(result);
    expect(result.quote.length).toBeGreaterThan(0);
    expect(result.author.length).toBeGreaterThan(0);
  });
});

describe("quotes dataset", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThan(0);
  });

  it("has every entry with non-empty quote/author and quote under 220 chars", () => {
    for (const q of quotes) {
      expect(typeof q.quote).toBe("string");
      expect(q.quote.length).toBeGreaterThan(0);
      expect(q.quote.length).toBeLessThan(220);
      expect(typeof q.author).toBe("string");
      expect(q.author.length).toBeGreaterThan(0);
    }
  });
});
