export type Arm = [number, number] | [number, number, number, number];
export type Leg =
  | [number, number, number]
  | [number, number, number, number]
  | [number, number, number, number, number];
export type Mark =
  | { t: "arrow"; from: [number, number]; to: [number, number]; both?: true }
  | { t: "line"; from: [number, number]; to: [number, number] }
  | { t: "dot"; at: [number, number] };
export interface Pose {
  view: "side" | "front" | "top";
  hip: [number, number];
  torso: number;
  chest?: number;
  head?: number;
  arms: [Arm, Arm];
  legs: [Leg, Leg];
  wall?: "left" | "right";
  air?: boolean;
  marks?: Mark[];
}

interface Point {
  x: number;
  y: number;
}

export interface FigureJoints {
  hip: Point;
  waist: Point;
  shoulder: Point;
  head: Point & { r: number };
  shoulders: [Point, Point];
  hips: [Point, Point];
  arms: { elbow: Point; hand: Point }[];
  legs: { knee: Point; ankle: Point; toe: Point }[];
}

export interface FigureExtent {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const FIGURE = {
  width: 120,
  height: 100,
  floorY: 90,
  margin: 3,
  wallX: { left: 8, right: 112 },
  lengths: {
    torso: 22,
    neck: 3,
    headR: 6,
    upperArm: 12,
    forearm: 12,
    thigh: 17,
    shin: 18,
    foot: 5,
  },
  front: { shoulderHalf: 8, hipHalf: 5 },
  farOpacity: 0.7,
  mark: { stroke: "var(--color-kw)", width: 2, head: 5, spread: 28 },
  topPatch: { x: 5, y: 8, width: 110, height: 84, r: 3 },
};

const L = FIGURE.lengths;
const M = FIGURE.mark;
const P = FIGURE.topPatch;
const RAD = Math.PI / 180;
const ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" fill="none" ' +
  'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ' +
  'focusable="false">';
const FLOOR_LINE = '<line x1="4" y1="92" x2="116" y2="92"/>';
const TOP_PATCH =
  `<rect x="${P.x}" y="${P.y}" width="${P.width}" height="${P.height}" ` +
  `rx="${P.r}"/>`;
const WALL_LINE = {
  left: '<line x1="6" y1="6" x2="6" y2="92"/>',
  right: '<line x1="114" y1="6" x2="114" y2="92"/>',
};

function point(x: number, y: number): Point {
  return { x, y };
}

function step(p: Point, deg: number, len: number): Point {
  return point(
    p.x + len * Math.cos(deg * RAD),
    p.y - len * Math.sin(deg * RAD),
  );
}

function armJoints(
  shoulder: Point,
  [upperDeg, lowerDeg, upperScale = 1, lowerScale = 1]: Arm,
) {
  const elbow = step(shoulder, upperDeg, L.upperArm * upperScale);
  return { elbow, hand: step(elbow, lowerDeg, L.forearm * lowerScale) };
}

function legJoints(
  hip: Point,
  [upperDeg, lowerDeg, footDeg, upperScale = 1, lowerScale = 1]: Leg,
) {
  const knee = step(hip, upperDeg, L.thigh * upperScale);
  const ankle = step(knee, lowerDeg, L.shin * lowerScale);
  return { knee, ankle, toe: step(ankle, footDeg, L.foot) };
}

export function figureJoints(pose: Pose): FigureJoints {
  const chest = pose.chest ?? pose.torso;
  const hip = point(pose.hip[0], pose.hip[1]);
  const waist = step(hip, pose.torso, L.torso / 2);
  const shoulder = step(waist, chest, L.torso / 2);
  const headCentre = step(shoulder, pose.head ?? chest, L.neck + L.headR);
  const spread = pose.view !== "side";
  const pair = (centre: Point, deg: number, half: number): [Point, Point] =>
    spread
      ? [step(centre, deg + 90, half), step(centre, deg - 90, half)]
      : [centre, centre];
  const shoulders = pair(shoulder, chest, FIGURE.front.shoulderHalf);
  const hips = pair(hip, pose.torso, FIGURE.front.hipHalf);
  return {
    hip,
    waist,
    shoulder,
    head: { ...headCentre, r: L.headR },
    shoulders,
    hips,
    arms: pose.arms.map((arm, i) => armJoints(shoulders[i]!, arm)),
    legs: pose.legs.map((leg, i) => legJoints(hips[i]!, leg)),
  };
}

export function figureExtent(pose: Pose): FigureExtent {
  const j = figureJoints(pose);
  const points = [
    j.hip,
    j.waist,
    j.shoulder,
    ...j.shoulders,
    ...j.hips,
    ...j.arms.flatMap((arm) => [arm.elbow, arm.hand]),
    ...j.legs.flatMap((leg) => [leg.knee, leg.ankle, leg.toe]),
  ];
  const xs = [
    ...points.map((p) => p.x),
    j.head.x - j.head.r,
    j.head.x + j.head.r,
  ];
  const ys = [
    ...points.map((p) => p.y),
    j.head.y - j.head.r,
    j.head.y + j.head.r,
  ];
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function num(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function line(a: Point, b: Point): string {
  return `<line x1="${num(a.x)}" y1="${num(a.y)}" x2="${num(b.x)}" y2="${num(b.y)}"/>`;
}

function polyline(points: Point[]): string {
  return `<polyline points="${points.map((p) => `${num(p.x)},${num(p.y)}`).join(" ")}"/>`;
}

function armLine(shoulder: Point, arm: FigureJoints["arms"][number]): string {
  return polyline([shoulder, arm.elbow, arm.hand]);
}

function legLine(hip: Point, leg: FigureJoints["legs"][number]): string {
  return polyline([hip, leg.knee, leg.ankle, leg.toe]);
}

function arrowHead(tip: Point, tail: Point): string {
  const back = Math.atan2(-(tail.y - tip.y), tail.x - tip.x) / RAD;
  return polyline([
    step(tip, back + M.spread, M.head),
    tip,
    step(tip, back - M.spread, M.head),
  ]);
}

function markSvg(mark: Mark): string {
  if (mark.t === "dot") {
    const [x, y] = mark.at;
    return `<circle cx="${num(x)}" cy="${num(y)}" r="1.5" fill="${M.stroke}" stroke="none"/>`;
  }
  const from = point(...mark.from);
  const to = point(...mark.to);
  if (mark.t !== "arrow") return line(from, to);
  return (
    line(from, to) +
    arrowHead(to, from) +
    (mark.both ? arrowHead(from, to) : "")
  );
}

export function figureSvg(pose: Pose): string {
  const j = figureJoints(pose);
  const side = pose.view === "side";
  const parts = [ROOT];

  const floor = pose.view === "top" ? TOP_PATCH : FLOOR_LINE;
  const wall = pose.wall ? WALL_LINE[pose.wall] : "";
  parts.push(`<g stroke-width="1.5" opacity="0.55">${floor}${wall}</g>`);

  if (side) {
    parts.push(
      `<g opacity="${FIGURE.farOpacity}">${armLine(j.shoulder, j.arms[1]!)}` +
        `${legLine(j.hip, j.legs[1]!)}</g>`,
    );
  }

  parts.push(polyline([j.hip, j.waist, j.shoulder]));
  if (!side) parts.push(line(...j.shoulders), line(...j.hips));
  parts.push(
    `<circle cx="${num(j.head.x)}" cy="${num(j.head.y)}" r="${j.head.r}"/>`,
  );

  const drawn = side ? [0] : [0, 1];
  for (const i of drawn) parts.push(armLine(j.shoulders[i]!, j.arms[i]!));
  for (const i of drawn) parts.push(legLine(j.hips[i]!, j.legs[i]!));

  if (pose.marks?.length) {
    parts.push(
      `<g stroke="${M.stroke}" stroke-width="${M.width}">` +
        `${pose.marks.map(markSvg).join("")}</g>`,
    );
  }

  parts.push("</svg>");
  return parts.join("");
}
