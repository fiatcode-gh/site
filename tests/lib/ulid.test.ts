import { describe, expect, it } from "vitest";
import { encodeTime, generateUlids, ulid } from "../../src/lib/tools/ulid";

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/; // Crockford base32, no I L O U

describe("encodeTime", () => {
  it("encodes the ULID spec example timestamp", () => {
    // From the ULID spec: ulid(1469918176385) => "01ARYZ6S41..."
    expect(encodeTime(1469918176385)).toBe("01ARYZ6S41");
  });

  it("encodes zero", () => {
    expect(encodeTime(0)).toBe("0000000000");
  });

  it("rejects negative or non-integer timestamps", () => {
    expect(() => encodeTime(-1)).toThrow();
    expect(() => encodeTime(1.5)).toThrow();
  });
});

describe("ulid", () => {
  it("produces 26-char Crockford base32", () => {
    expect(ulid()).toMatch(ULID_RE);
  });

  it("embeds the given timestamp in the first 10 chars", () => {
    expect(ulid(1469918176385).slice(0, 10)).toBe("01ARYZ6S41");
  });

  it("produces distinct values", () => {
    expect(ulid()).not.toBe(ulid());
  });
});

describe("generateUlids", () => {
  it("generates N valid ULIDs", () => {
    const ids = generateUlids(3);
    expect(ids).toHaveLength(3);
    for (const id of ids) expect(id).toMatch(ULID_RE);
  });

  it("rejects out-of-range counts", () => {
    expect(() => generateUlids(0)).toThrow();
    expect(() => generateUlids(1001)).toThrow();
  });
});
