const B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let bin = "";
  const chunk = 0x8000; // avoid call-stack limits on large files
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(bin);
  if (!urlSafe) return b64;
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function encodeText(input: string, urlSafe = false): string {
  return bytesToBase64(new TextEncoder().encode(input), urlSafe);
}

export function base64ToBytes(input: string): Uint8Array {
  const normalized = input.trim().replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  if (!B64_RE.test(padded)) throw new Error("not valid base64");
  let bin: string;
  try {
    bin = atob(padded);
  } catch {
    throw new Error("not valid base64");
  }
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function decodeText(input: string): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(base64ToBytes(input));
}
