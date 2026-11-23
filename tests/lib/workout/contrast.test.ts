import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(
  path.resolve(__dirname, "../../../src/styles/global.css"),
  "utf8",
);

function block(start: RegExp): string {
  const match = start.exec(css);
  if (!match) throw new Error(`${start} not found in global.css`);
  const end = css.indexOf("}", match.index + match[0].length);
  return css.slice(match.index + match[0].length, end);
}

function colours(text: string): Record<string, string> {
  return Object.fromEntries(
    [...text.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [
      m[1]!,
      m[2]!,
    ]),
  );
}

const light = colours(block(/@theme static \{/));
const dark = {
  ...light,
  ...colours(block(/@media \(prefers-color-scheme: dark\) \{\s*:root \{/)),
};
const THEMES = { light, dark } as const;

const TEXT_PAIRS: [string, string][] = [
  ...["surface", "raised", "chrome", "hover", "select", "mark"].map(
    (bg): [string, string] => ["fg", bg],
  ),
  ...["surface", "raised", "chrome", "hover", "select"].map(
    (bg): [string, string] => ["muted", bg],
  ),
  ...["surface", "raised", "chrome"].map((bg): [string, string] => [
    "faint",
    bg,
  ]),
  ["surface", "fn"],
  ...["fn", "kw", "str"].flatMap((fg) =>
    ["surface", "raised"].map((bg): [string, string] => [fg, bg]),
  ),
];

const NON_TEXT_PAIRS: [string, string][] = [
  ["field", "surface"],
  ["field", "raised"],
  ["fn", "surface"],
  ["fn", "raised"],
  ["fn", "chrome"],
  ["kw", "surface"],
  ["kw", "raised"],
  ["kw", "select"],
  ["active", "surface"],
  ["active", "chrome"],
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

function assertPairs(pairs: [string, string][], minimum: number): void {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    for (const [fg, bg] of pairs) {
      const a = tokens[fg as keyof typeof tokens];
      const b = tokens[bg as keyof typeof tokens];
      expect(
        Boolean(a && b),
        `${theme}: --color-${fg} or --color-${bg} missing`,
      ).toBe(true);
      const ratio = contrast(a!, b!);
      expect(
        ratio >= minimum,
        `${theme}: ${fg} on ${bg}: ${ratio.toFixed(2)} < ${minimum}`,
      ).toBe(true);
    }
  }
}

describe("workout/contrast", () => {
  it("text colour pairs reach 4.5:1", () => {
    expect(contrast(light.fg!, light.surface!)).toBeGreaterThan(15);
    assertPairs(TEXT_PAIRS, 4.5);
  });

  it("focus and border pairs reach 3:1", () => {
    assertPairs(NON_TEXT_PAIRS, 3);
  });
});
