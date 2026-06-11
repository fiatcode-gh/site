import { base64ToBytes } from "./base64";

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export interface ClaimInfo {
  key: string;
  value: unknown;
  meaning?: string;
  date?: string;
}

const STANDARD_CLAIMS: Record<string, string> = {
  iss: "issuer",
  sub: "subject",
  aud: "audience",
  exp: "expires at",
  nbf: "not before",
  iat: "issued at",
  jti: "JWT ID",
};

const TIME_CLAIMS = new Set(["exp", "nbf", "iat"]);

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error(`expected 3 segments, got ${parts.length}`);
  }
  const [header, payload, signature] = parts;
  return {
    header: decodeSegment(header, "header"),
    payload: decodeSegment(payload, "payload"),
    signature,
  };
}

function decodeSegment(
  segment: string,
  label: string,
): Record<string, unknown> {
  let json: string;
  try {
    json = new TextDecoder("utf-8", { fatal: true }).decode(
      base64ToBytes(segment),
    );
  } catch {
    throw new Error(`${label}: not valid base64url`);
  }
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error(`${label}: not valid JSON`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label}: not a JSON object`);
  }
  return value as Record<string, unknown>;
}

export function describeClaims(
  payload: Record<string, unknown>,
  now: number = Date.now(),
): { claims: ClaimInfo[]; expiry: "none" | "valid" | "expired" } {
  const claims: ClaimInfo[] = Object.entries(payload).map(([key, value]) => {
    const info: ClaimInfo = { key, value, meaning: STANDARD_CLAIMS[key] };
    if (TIME_CLAIMS.has(key) && typeof value === "number") {
      info.date = new Date(value * 1000).toISOString();
    }
    return info;
  });
  const exp = payload.exp;
  const expiry =
    typeof exp !== "number" ? "none" : exp * 1000 < now ? "expired" : "valid";
  return { claims, expiry };
}
