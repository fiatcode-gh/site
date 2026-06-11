import { describe, expect, it } from "vitest";
import { qrMatrix, qrSvg } from "../../src/lib/tools/qr";

describe("qrSvg", () => {
  it("renders an SVG string", () => {
    const svg = qrSvg("https://fiatcode.dev", { ecc: "M", border: 2 });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("rejects empty input", () => {
    expect(() => qrSvg("", { ecc: "M", border: 2 })).toThrow();
  });
});

describe("qrMatrix", () => {
  it("returns a square boolean matrix", () => {
    const { data, size } = qrMatrix("hello", { ecc: "M", border: 2 });
    expect(size).toBeGreaterThan(0);
    expect(data).toHaveLength(size);
    expect(data[0]).toHaveLength(size);
    expect(typeof data[0][0]).toBe("boolean");
  });

  it("border adds modules on every side", () => {
    const noBorder = qrMatrix("hello", { ecc: "M", border: 0 });
    const withBorder = qrMatrix("hello", { ecc: "M", border: 2 });
    expect(withBorder.size).toBe(noBorder.size + 4);
  });

  it("rejects empty input", () => {
    expect(() => qrMatrix("", { ecc: "M", border: 2 })).toThrow();
  });
});

describe("input hardening", () => {
  it("throws when text exceeds QR capacity", () => {
    expect(() => qrSvg("x".repeat(5000), { ecc: "M", border: 2 })).toThrow();
  });

  it("clamps out-of-range borders instead of corrupting the matrix", () => {
    const neg = qrMatrix("hello", { ecc: "M", border: -5 });
    const zero = qrMatrix("hello", { ecc: "M", border: 0 });
    expect(neg.size).toBe(zero.size);

    const huge = qrMatrix("hello", { ecc: "M", border: 999 });
    const ten = qrMatrix("hello", { ecc: "M", border: 10 });
    expect(huge.size).toBe(ten.size);
  });
});
