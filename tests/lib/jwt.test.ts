import { describe, expect, it } from "vitest";
import { encodeText } from "../../src/lib/tools/base64";
import { decodeJwt, describeClaims } from "../../src/lib/tools/jwt";

function makeToken(header: object, payload: object): string {
  return [
    encodeText(JSON.stringify(header), true),
    encodeText(JSON.stringify(payload), true),
    "fake-signature",
  ].join(".");
}

const HEADER = { alg: "HS256", typ: "JWT" };
const PAYLOAD = {
  sub: "1234567890",
  name: "John Doe",
  iat: 1516239022,
  exp: 1516242622,
};

describe("decodeJwt", () => {
  it("decodes header, payload, and keeps the signature segment", () => {
    const decoded = decodeJwt(makeToken(HEADER, PAYLOAD));
    expect(decoded.header).toEqual(HEADER);
    expect(decoded.payload).toEqual(PAYLOAD);
    expect(decoded.signature).toBe("fake-signature");
  });

  it("tolerates surrounding whitespace", () => {
    const decoded = decodeJwt(`  ${makeToken(HEADER, PAYLOAD)}\n`);
    expect(decoded.header).toEqual(HEADER);
  });

  it("rejects tokens without exactly 3 segments", () => {
    expect(() => decodeJwt("a.b")).toThrow(/3 segments/);
    expect(() => decodeJwt("a.b.c.d")).toThrow(/3 segments/);
  });

  it("rejects segments that are not base64url", () => {
    expect(() => decodeJwt("??.??.x")).toThrow(/header/);
  });

  it("rejects segments that are not JSON objects", () => {
    const notObject = encodeText('"just a string"', true);
    const token = `${notObject}.${notObject}.x`;
    expect(() => decodeJwt(token)).toThrow(/not a JSON object/);
  });
});

describe("describeClaims", () => {
  it("annotates standard claims and formats unix-time claims", () => {
    const { claims } = describeClaims(PAYLOAD);
    const iat = claims.find((c) => c.key === "iat");
    expect(iat?.meaning).toBe("issued at");
    expect(iat?.date).toBe("2018-01-18T01:30:22.000Z");
    const name = claims.find((c) => c.key === "name");
    expect(name?.meaning).toBeUndefined();
  });

  it("flags an expired token", () => {
    const { expiry } = describeClaims(
      { exp: 1000 },
      2000 * 1000, // "now" after exp
    );
    expect(expiry).toBe("expired");
  });

  it("flags a still-valid token", () => {
    const { expiry } = describeClaims({ exp: 2000 }, 1000 * 1000);
    expect(expiry).toBe("valid");
  });

  it("reports no expiry when exp is absent", () => {
    const { expiry } = describeClaims({ sub: "x" });
    expect(expiry).toBe("none");
  });
});
