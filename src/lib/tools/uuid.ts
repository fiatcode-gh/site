import { assertCount } from "./ulid";

export function generateUuids(count: number): string[] {
  assertCount(count);
  return Array.from({ length: count }, () => crypto.randomUUID());
}
