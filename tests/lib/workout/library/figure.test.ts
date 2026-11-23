import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FIGURE,
  figureExtent,
  figureJoints,
  figureSvg,
  type Pose,
} from "../../../../src/lib/tools/workout/library/figure";

const STANDING: Pose = {
  view: "side",
  hip: [60, 55],
  torso: 90,
  arms: [
    [270, 270],
    [270, 270],
  ],
  legs: [
    [270, 270, 0],
    [270, 270, 0],
  ],
};

const FRONT: Pose = { ...STANDING, view: "front" };

const TOP: Pose = {
  view: "top",
  hip: [50, 50],
  torso: 0,
  arms: [
    [90, 90],
    [270, 270],
  ],
  legs: [
    [170, 170, 170],
    [190, 190, 190],
  ],
};

const ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none" ' +
  'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ' +
  'focusable="false">';
const FLOOR_LINE = '<line x1="4" y1="92" x2="116" y2="92"/>';
const TOP_PATCH = '<rect x="5" y="8" width="110" height="84" rx="3"/>';
const MARKS_OPEN = '<g stroke="var(--color-kw)" stroke-width="2">';

type Point = { x: number; y: number };

function near(actual: Point, expected: Point, label: string) {
  expect(
    Math.abs(actual.x - expected.x) < 1e-9 &&
      Math.abs(actual.y - expected.y) < 1e-9,
    `${label}: expected (${expected.x}, ${expected.y}), got (${actual.x}, ${actual.y})`,
  ).toBeTruthy();
}

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

describe("workout/library/figure", () => {
  it("standing side pose places waist, shoulder, head and limbs", () => {
    const joints = figureJoints(STANDING);
    near(joints.hip, { x: 60, y: 55 }, "hip");
    near(joints.waist, { x: 60, y: 44 }, "waist");
    near(joints.shoulder, { x: 60, y: 33 }, "shoulder");
    near(joints.head, { x: 60, y: 24 }, "head");
    expect(joints.head.r).toBe(6);
    near(joints.arms[0]!.elbow, { x: 60, y: 45 }, "near elbow");
    near(joints.arms[1]!.hand, { x: 60, y: 57 }, "far hand");
    near(joints.legs[0]!.knee, { x: 60, y: 72 }, "knee");
    near(joints.legs[0]!.ankle, { x: 60, y: 90 }, "ankle");
    near(joints.legs[0]!.toe, { x: 65, y: 90 }, "toe");
  });

  it("chest bends the spine at the waist and the head follows the chest", () => {
    const bent: Pose = { ...STANDING, hip: [60, 60], torso: 0, chest: 90 };
    const joints = figureJoints(bent);
    near(joints.waist, { x: 71, y: 60 }, "waist");
    near(joints.shoulder, { x: 71, y: 49 }, "shoulder");
    near(joints.head, { x: 71, y: 40 }, "head follows chest");
    near(
      figureJoints({ ...bent, head: 0 }).head,
      { x: 80, y: 49 },
      "explicit head",
    );
    const front = figureJoints({ ...bent, view: "front" });
    near(front.shoulders[0], { x: 63, y: 49 }, "shoulder 0 across the chest");
    near(front.shoulders[1], { x: 79, y: 49 }, "shoulder 1 across the chest");
    near(front.hips[0], { x: 60, y: 55 }, "hip 0 across the torso");
    near(front.hips[1], { x: 60, y: 65 }, "hip 1 across the torso");
  });

  it("front pose spreads shoulders and hips; top uses the same joints", () => {
    const joints = figureJoints(FRONT);
    near(joints.shoulders[0], { x: 52, y: 33 }, "shoulder 0");
    near(joints.shoulders[1], { x: 68, y: 33 }, "shoulder 1");
    near(joints.hips[0], { x: 55, y: 55 }, "hip 0");
    near(joints.hips[1], { x: 65, y: 55 }, "hip 1");
    near(
      joints.arms[0]!.elbow,
      { x: 52, y: 45 },
      "arm 0 starts at its own shoulder",
    );
    expect(figureJoints(TOP)).toStrictEqual(
      figureJoints({ ...TOP, view: "front" }),
    );
  });

  it("scales shorten only the scaled segment", () => {
    const joints = figureJoints({
      ...STANDING,
      arms: [
        [0, 0, 0.5, 1],
        [270, 270],
      ],
      legs: [
        [270, 270, 0, 1, 0.5],
        [270, 270, 0],
      ],
    });
    near(joints.arms[0]!.elbow, { x: 66, y: 33 }, "scaled elbow");
    near(joints.arms[0]!.hand, { x: 78, y: 33 }, "unscaled forearm");
    near(joints.legs[0]!.knee, { x: 60, y: 72 }, "unscaled thigh");
    near(joints.legs[0]!.ankle, { x: 60, y: 81 }, "scaled shin");
    near(joints.legs[0]!.toe, { x: 65, y: 81 }, "foot keeps its length");
  });

  it("figureExtent covers the head circle and the waist", () => {
    expect(figureExtent(STANDING)).toStrictEqual({
      minX: 54,
      maxX: 66,
      minY: 18,
      maxY: 90,
    });
    expect(figureExtent({ ...STANDING, hip: [60, 60], chest: 270 }).minY).toBe(
      49,
    );
  });

  it("figureSvg is deterministic and draws the torso polyline and head", () => {
    const svg = figureSvg(STANDING);
    expect(svg).toBe(figureSvg(structuredClone(STANDING)));
    expect(svg.startsWith(ROOT), svg.slice(0, ROOT.length)).toBeTruthy();
    expect(svg.endsWith("</svg>")).toBeTruthy();
    expect(
      svg.includes('<polyline points="60,55 60,44 60,33"/>'),
      svg,
    ).toBeTruthy();
    expect(svg.includes('<circle cx="60" cy="24" r="6"/>'), svg).toBeTruthy();
  });

  it("side and front views draw the floor line; top view draws the floor panel", () => {
    for (const pose of [STANDING, FRONT]) {
      const svg = figureSvg(pose);
      expect(svg.includes(FLOOR_LINE), pose.view).toBeTruthy();
      expect(!svg.includes("<rect"), pose.view).toBeTruthy();
    }
    const top = figureSvg(TOP);
    expect(top.includes(TOP_PATCH), top).toBeTruthy();
    expect(!top.includes(FLOOR_LINE)).toBeTruthy();
    expect(
      figureSvg({ ...STANDING, floor: false } as never).includes(FLOOR_LINE),
    ).toBeTruthy();
  });

  it("figureSvg draws the wall at 6 or 114 when asked", () => {
    const left = '<line x1="6" y1="6" x2="6" y2="92"/>';
    const right = '<line x1="114" y1="6" x2="114" y2="92"/>';
    expect(
      figureSvg({ ...STANDING, wall: "left" }).includes(left),
    ).toBeTruthy();
    expect(
      figureSvg({ ...STANDING, wall: "right" }).includes(right),
    ).toBeTruthy();
    expect(!figureSvg(STANDING).includes(left)).toBeTruthy();
    expect(!figureSvg(STANDING).includes(right)).toBeTruthy();
  });

  it("far limbs sit in a 0.7 opacity group in side view only", () => {
    const side = figureSvg(STANDING);
    const far = side.match(/<g opacity="0.7">(.*?)<\/g>/);
    expect(far, "side view has a far-limb group").toBeTruthy();
    expect(count(far![1]!, /<polyline /g)).toBe(2);
    expect(count(side, /<polyline /g)).toBe(5);
    const bars: [Pose, string, string][] = [
      [
        FRONT,
        '<line x1="52" y1="33" x2="68" y2="33"/>',
        '<line x1="55" y1="55" x2="65" y2="55"/>',
      ],
      [
        TOP,
        '<line x1="72" y1="42" x2="72" y2="58"/>',
        '<line x1="50" y1="45" x2="50" y2="55"/>',
      ],
    ];
    for (const [pose, shoulderBar, hipBar] of bars) {
      const svg = figureSvg(pose);
      expect(!svg.includes('<g opacity="0.7">'), pose.view).toBeTruthy();
      expect(count(svg, /<polyline /g), pose.view).toBe(5);
      expect(
        svg.includes(shoulderBar),
        `${pose.view} shoulder bar`,
      ).toBeTruthy();
      expect(svg.includes(hipBar), `${pose.view} hip bar`).toBeTruthy();
    }
  });

  it("an arrow is a shaft and a head in the accent marks group", () => {
    const arrow = {
      t: "arrow" as const,
      from: [20, 50] as [number, number],
      to: [20, 30] as [number, number],
    };
    const shaft =
      '<line x1="20" y1="50" x2="20" y2="30"/>' +
      '<polyline points="22.3,34.4 20,30 17.7,34.4"/>';
    const one = figureSvg({ ...STANDING, marks: [arrow] });
    expect(one.includes(`${MARKS_OPEN}${shaft}</g>`), one).toBeTruthy();
    const both = figureSvg({ ...STANDING, marks: [{ ...arrow, both: true }] });
    expect(
      both.includes(
        `${MARKS_OPEN}${shaft}<polyline points="17.7,45.6 20,50 22.3,45.6"/></g>`,
      ),
      both,
    ).toBeTruthy();
  });

  it("a dot mark is a filled accent circle; no marks means no marks group", () => {
    const svg = figureSvg({ ...STANDING, marks: [{ t: "dot", at: [50, 50] }] });
    expect(
      svg.includes(
        '<circle cx="50" cy="50" r="1.5" fill="var(--color-kw)" stroke="none"/>',
      ),
      svg,
    ).toBeTruthy();
    expect(!figureSvg(STANDING).includes(MARKS_OPEN)).toBeTruthy();
    expect(
      !figureSvg({ ...STANDING, marks: [] }).includes(MARKS_OPEN),
    ).toBeTruthy();
  });

  it("the mark stroke is the site's kw token", () => {
    expect(FIGURE.mark.stroke).toBe("var(--color-kw)");
    const repo = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
      "..",
    );
    const css = fs.readFileSync(
      path.join(repo, "src", "styles", "global.css"),
      "utf8",
    );
    const themeAt = css.indexOf("@theme");
    const darkAt = css.indexOf("@media (prefers-color-scheme: dark)");
    const defs = [...css.matchAll(/--color-kw:\s*([^;]+);/g)];
    expect(defs.map((match) => match[1])).toStrictEqual([
      expect.stringMatching(/^#[0-9a-f]{6}$/i),
      expect.stringMatching(/^#[0-9a-f]{6}$/i),
    ]);
    const [light, dark] = defs.map((match) => match.index);
    expect(themeAt >= 0 && themeAt < light! && light! < darkAt).toBeTruthy();
    expect(darkAt < dark!).toBeTruthy();
  });

  it("figureSvg carries no ids, classes, styles, titles or scripts", () => {
    const svg = figureSvg({
      ...FRONT,
      wall: "left",
      marks: [
        { t: "arrow", from: [20, 50], to: [20, 30] },
        { t: "arrow", from: [30, 50], to: [30, 30], both: true },
        { t: "line", from: [30, 50], to: [40, 50] },
        { t: "dot", at: [50, 50] },
      ],
    });
    for (const forbidden of ["class=", "style=", "id=", "<title", "<script"]) {
      expect(!svg.includes(forbidden), forbidden).toBeTruthy();
    }
  });
});
