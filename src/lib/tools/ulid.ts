// Hand-rolled ULID (https://github.com/ulid/spec): 10 chars of
// millisecond timestamp + 16 chars of randomness, Crockford base32.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Assumes timestamp < 2^48 (the ULID spec ceiling, year 10889); larger values wrap.
export function encodeTime(timestamp: number, length = 10): string {
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    throw new Error("timestamp must be a non-negative integer");
  }
  let out = "";
  let t = timestamp;
  for (let i = 0; i < length; i++) {
    out = ALPHABET[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

function encodeRandom(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  // 256 / 32 = 8 exactly, so the modulo introduces no bias
  for (const b of bytes) out += ALPHABET[b % 32];
  return out;
}

export function ulid(timestamp: number = Date.now()): string {
  return encodeTime(timestamp) + encodeRandom();
}

export function generateUlids(count: number): string[] {
  assertCount(count);
  return Array.from({ length: count }, () => ulid());
}

export function assertCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new Error("count must be an integer between 1 and 1000");
  }
}
