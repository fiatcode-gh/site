import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);
const libRoot = path.join(repo, "src", "lib", "tools", "workout");
const testRoot = path.join(repo, "tests", "lib", "workout");
const TEST_EXEMPT = [
  /^types\.ts$/,
  /^core\/version\.ts$/,
  /^core\/reasons\.ts$/,
  /^library\/patterns\.ts$/,
  /^library\/movements\/[^/]+\.ts$/,
  /^library\/poses\/[^/]+\.ts$/,
];
const BROWSER_GLOBALS = [
  "document",
  "window",
  "localStorage",
  "sessionStorage",
  "navigator",
  "location",
  "Blob",
  "FileReader",
  "AudioContext",
  "setInterval",
  "setTimeout",
  "requestAnimationFrame",
];
const FORBIDDEN = [
  new RegExp(`\\b(${BROWSER_GLOBALS.join("|")})\\b`),
  /Date\.now\(/,
  /new Date\(\s*\)/,
  /Math\.random/,
];
const NETWORK =
  /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\b/;
const RAW_HTML = /\{@html|set:html|innerHTML/g;
const TOOL_ROOTS = [
  "src/lib/tools/workout",
  "src/components/tools/workout",
  "src/pages/tools/workout",
  "src/components/tools/WorkoutTool.svelte",
  "src/pages/tools/workout.astro",
];

function listFiles(target: string): string[] {
  if (!fs.statSync(target).isDirectory()) return [target];
  return fs
    .readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => listFiles(path.join(target, entry.name)));
}

const modules = listFiles(libRoot)
  .filter((full) => full.endsWith(".ts"))
  .map((full) => ({
    full,
    rel: path.relative(libRoot, full).split(path.sep).join("/"),
  }));

const STATIC_IMPORT = /\b(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g;
const BARE_IMPORT = /\bimport\s*\(?\s*['"]([^'"]+)['"]/g;

function importSpecifiers(source: string): string[] {
  return [
    ...source.matchAll(STATIC_IMPORT),
    ...source.matchAll(BARE_IMPORT),
  ].map((match) => match[1]!);
}

describe("workout/architecture", () => {
  it("R1/R2: domain modules use no browser globals or ambient clock", () => {
    for (const { full, rel } of modules) {
      const source = fs.readFileSync(full, "utf8");
      for (const pattern of FORBIDDEN) {
        const match = source.match(pattern);
        expect(match, `${rel} uses forbidden token ${match?.[0]}`).toBe(null);
      }
    }
  });

  it("R3: domain modules never import components or the @/ alias", () => {
    for (const { full, rel } of modules) {
      for (const specifier of importSpecifiers(fs.readFileSync(full, "utf8"))) {
        expect(
          !specifier.startsWith("@/") &&
            !specifier.includes("components") &&
            !specifier.endsWith(".svelte"),
          `${rel} imports ${specifier}`,
        ).toBeTruthy();
      }
    }
  });

  it("R4: every domain module imports cleanly in Node", async () => {
    expect(modules.length).toBeGreaterThan(0);
    for (const { full, rel } of modules) {
      await expect(
        import(/* @vite-ignore */ full),
        `${rel} failed to import`,
      ).resolves.toBeDefined();
    }
  });

  it("R5: every domain module has a mirrored test file", () => {
    for (const { rel } of modules) {
      if (TEST_EXEMPT.some((pattern) => pattern.test(rel))) continue;
      const testRel = rel.replace(/\.ts$/, ".test.ts");
      expect(
        fs.existsSync(path.join(testRoot, testRel)),
        `${rel} has no tests/lib/workout/${testRel}`,
      ).toBeTruthy();
    }
  });

  it("R6: the only raw-HTML sink in the tool is Figure.svelte", () => {
    const sinks = TOOL_ROOTS.filter((root) => root !== "src/lib/tools/workout")
      .map((root) => path.join(repo, root))
      .filter((target) => fs.existsSync(target))
      .flatMap(listFiles)
      .flatMap((full) =>
        [...fs.readFileSync(full, "utf8").matchAll(RAW_HTML)].map(
          (match) => `${path.relative(repo, full)}: ${match[0]}`,
        ),
      );
    expect(sinks).toStrictEqual([
      "src/components/tools/workout/Figure.svelte: {@html",
    ]);
  });

  it("R7: the tool references no network API", () => {
    expect(NETWORK.test("fetch(")).toBe(true);
    const files = TOOL_ROOTS.map((root) => path.join(repo, root))
      .filter((target) => fs.existsSync(target))
      .flatMap(listFiles);
    for (const full of files) {
      const match = fs.readFileSync(full, "utf8").match(NETWORK);
      expect(
        match,
        `${path.relative(repo, full)} references ${match?.[0]}`,
      ).toBe(null);
    }
  });
});
