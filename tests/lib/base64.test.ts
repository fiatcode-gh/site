import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  bytesToBase64,
  decodeText,
  encodeText,
} from "../../src/lib/tools/base64";

describe("encodeText", () => {
  it("encodes ASCII", () => {
    expect(encodeText("hello")).toBe("aGVsbG8=");
  });

  it("encodes non-ASCII UTF-8 correctly (not btoa-broken)", () => {
    expect(encodeText("héllo ✓")).toBe("aMOpbGxvIOKckw==");
  });

  it("round-trips emoji", () => {
    expect(decodeText(encodeText("🦊 fox"))).toBe("🦊 fox");
  });
});

describe("bytesToBase64 url-safe variant", () => {
  it("replaces +/ with -_ and strips padding", () => {
    const bytes = Uint8Array.of(0xfb, 0xef, 0xbe);
    expect(bytesToBase64(bytes)).toBe("++++");
    expect(bytesToBase64(bytes, true)).toBe("----");
    expect(bytesToBase64(Uint8Array.of(0xff, 0xff, 0xff), true)).toBe("____");
    expect(bytesToBase64(Uint8Array.of(0x68), true)).toBe("aA"); // no '=' padding
  });
});

describe("decodeText", () => {
  it("accepts unpadded input", () => {
    expect(decodeText("aGVsbG8")).toBe("hello");
  });

  it("accepts url-safe input", () => {
    expect(decodeText(encodeText("héllo ✓", true))).toBe("héllo ✓");
  });

  it("rejects invalid base64", () => {
    expect(() => decodeText("not base64!!!")).toThrow();
  });

  it("rejects base64 that decodes to invalid UTF-8", () => {
    expect(() => decodeText(bytesToBase64(Uint8Array.of(0xff)))).toThrow();
  });
});

describe("base64ToBytes", () => {
  it("decodes to the original bytes", () => {
    expect(Array.from(base64ToBytes("++++"))).toEqual([0xfb, 0xef, 0xbe]);
  });
});
