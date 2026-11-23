import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import {
  figureExtent,
  figureJoints,
  type FigureJoints,
  type Pose,
} from "../../../../src/lib/tools/workout/library/figure";
import {
  MOVEMENTS,
  variation,
} from "../../../../src/lib/tools/workout/library/library";
import {
  POSES,
  poseFor,
} from "../../../../src/lib/tools/workout/library/poses";
import { PLACEMENT_TESTS } from "../../../../src/lib/tools/workout/placement/placement";

type Point = { x: number; y: number };
type Segment = [Point, Point];

const entries = Object.entries(POSES);

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegment(p: Point, [a, b]: Segment): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq),
        );
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function point([x, y]: [number, number]): Point {
  return { x, y };
}

function torsoSegments(j: FigureJoints): Segment[] {
  return [
    [j.hip, j.waist],
    [j.waist, j.shoulder],
  ];
}

function limbSegments(j: FigureJoints): Segment[] {
  return [
    ...j.arms.flatMap((arm, i): Segment[] => [
      [j.shoulders[i]!, arm.elbow],
      [arm.elbow, arm.hand],
    ]),
    ...j.legs.flatMap((leg, i): Segment[] => [
      [j.hips[i]!, leg.knee],
      [leg.knee, leg.ankle],
      [leg.ankle, leg.toe],
    ]),
  ];
}

function bodySegments(pose: Pose, j: FigureJoints): Segment[] {
  const bars = pose.view === "side" ? [] : [j.shoulders, j.hips];
  return [...torsoSegments(j), ...limbSegments(j), ...bars];
}

function arrows(pose: Pose) {
  return (pose.marks ?? []).filter((mark) => mark.t === "arrow");
}

function keyPoints(pose: Pose): Point[] {
  const j = figureJoints(pose);
  const points = [
    j.hip,
    j.waist,
    j.shoulder,
    j.head,
    ...j.arms.flatMap((arm) => [arm.elbow, arm.hand]),
    ...j.legs.flatMap((leg) => [leg.knee, leg.ankle, leg.toe]),
  ];
  return points.map((p) => ({ x: p.x - j.hip.x, y: p.y }));
}

function poseDistance(a: Pose, b: Pose): number {
  const pa = keyPoints(a);
  const pb = keyPoints(b);
  return Math.max(...pa.map((p, i) => distance(p, pb[i]!)));
}

function sameEnds([a, b]: Segment, [c, d]: Segment): boolean {
  const eq = (p: Point, q: Point) =>
    Math.abs(p.x - q.x) < 1e-6 && Math.abs(p.y - q.y) < 1e-6;
  return (eq(a, c) && eq(b, d)) || (eq(a, d) && eq(b, c));
}

interface Named {
  limb: string;
  name: string;
  seg: Segment;
}

function longSegments(j: FigureJoints): Named[] {
  return [
    ...j.arms.flatMap((arm, i): Named[] => [
      {
        limb: `arm ${i}`,
        name: "upper arm",
        seg: [j.shoulders[i]!, arm.elbow],
      },
      { limb: `arm ${i}`, name: "forearm", seg: [arm.elbow, arm.hand] },
    ]),
    ...j.legs.flatMap((leg, i): Named[] => [
      { limb: `leg ${i}`, name: "thigh", seg: [j.hips[i]!, leg.knee] },
      { limb: `leg ${i}`, name: "shin", seg: [leg.knee, leg.ankle] },
    ]),
  ];
}

describe("workout/library/poses", () => {
  it("every library variation has a pose and there are exactly 87 poses", () => {
    const ids = MOVEMENTS.flatMap((m) => m.variations.map(({ id }) => id));
    expect(ids.filter((id) => !Object.hasOwn(POSES, id))).toStrictEqual([]);
    expect(Object.keys(POSES).length).toBe(87);
  });

  it("every placement test variation has a pose", () => {
    for (const { variationId } of PLACEMENT_TESTS) {
      expect(poseFor(variationId), `${variationId} has no pose`).toBeTruthy();
    }
  });

  it("every pose key is a library variation id", () => {
    for (const [id] of entries) {
      expect(variation(id), `${id} is not a variation`).toBeTruthy();
    }
  });

  it("poseFor returns undefined for an unknown id", () => {
    expect(poseFor("nope")).toBe(undefined);
  });

  it("I1 frame: every pose stays inside the margin", () => {
    for (const [id, pose] of entries) {
      const { minX, maxX, minY, maxY } = figureExtent(pose);
      expect(
        minX >= 3 && maxX <= 117,
        `${id} x extent ${minX}..${maxX}`,
      ).toBeTruthy();
      expect(
        minY >= 3 && maxY <= 93,
        `${id} y extent ${minY}..${maxY}`,
      ).toBeTruthy();
    }
  });

  it("I2 floor: grounded poses touch the floor; top poses lie inside the panel", () => {
    for (const [id, pose] of entries) {
      const extent = figureExtent(pose);
      if (pose.view === "top") {
        expect(pose.hip[1], `${id} top hip y ${pose.hip[1]}`).toBe(50);
        expect(pose.torso, `${id} top torso ${pose.torso}`).toBe(0);
        expect(
          !pose.wall && !pose.air,
          `${id} top pose has a wall or air`,
        ).toBeTruthy();
        const { minX, maxX, minY, maxY } = extent;
        expect(
          minX >= 9 && maxX <= 111,
          `${id} top x extent ${minX}..${maxX}`,
        ).toBeTruthy();
        expect(
          minY >= 12 && maxY <= 88,
          `${id} top y extent ${minY}..${maxY}`,
        ).toBeTruthy();
      } else if (pose.air !== true) {
        expect(
          Math.abs(extent.maxY - 90) <= 1.5,
          `${id} lowest point ${extent.maxY}`,
        ).toBeTruthy();
      }
    }
  });

  it("I3 air: airborne poses float 4 to 20 above the floor", () => {
    for (const [id, pose] of entries) {
      if (pose.air !== true) continue;
      const gap = 90 - figureExtent(pose).maxY;
      expect(gap >= 4 && gap <= 20, `${id} floats ${gap}`).toBeTruthy();
    }
  });

  it("I4 wall: wall poses touch the wall without crossing it", () => {
    for (const [id, pose] of entries) {
      if (!pose.wall) continue;
      const { minX, maxX } = figureExtent(pose);
      const j = figureJoints(pose);
      const xs = [
        ...j.arms.map((arm) => arm.hand.x),
        ...j.legs.flatMap((leg) => [leg.toe.x, leg.ankle.x]),
        j.hip.x,
        ...j.hips.map((p) => p.x),
        j.shoulder.x,
        ...j.shoulders.map((p) => p.x),
      ];
      if (pose.wall === "right") {
        const reach = Math.max(...xs, j.head.x + j.head.r);
        expect(
          maxX <= 112.5,
          `${id} crosses the right wall at ${maxX}`,
        ).toBeTruthy();
        expect(reach >= 109.5, `${id} reaches only ${reach}`).toBeTruthy();
      } else {
        const reach = Math.min(...xs, j.head.x - j.head.r);
        expect(
          minX >= 7.5,
          `${id} crosses the left wall at ${minX}`,
        ).toBeTruthy();
        expect(reach <= 10.5, `${id} reaches only ${reach}`).toBeTruthy();
      }
    }
  });

  it("I5 ranges: scales, chest bend and mark points", () => {
    for (const [id, pose] of entries) {
      const scales = [
        ...pose.arms.flatMap((arm) => arm.slice(2)),
        ...pose.legs.flatMap((leg) => leg.slice(3)),
      ];
      for (const scale of scales) {
        expect(scale >= 0.4 && scale <= 1, `${id} scale ${scale}`).toBeTruthy();
      }
      if (pose.chest !== undefined) {
        const bend = angleDiff(pose.chest, pose.torso);
        expect(bend <= 75, `${id} chest bends ${bend}`).toBeTruthy();
      }
      for (const mark of pose.marks ?? []) {
        for (const [x, y] of mark.t === "dot"
          ? [mark.at]
          : [mark.from, mark.to]) {
          expect(
            x >= 0 && x <= 120 && y >= 0 && y <= 100,
            `${id} mark at ${x}, ${y}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("I6 distinct: variations of one movement differ visibly", () => {
    for (const { id: movementId, variations } of MOVEMENTS) {
      const posed = variations.filter((v) => POSES[v.id]);
      for (let i = 0; i < posed.length; i += 1) {
        for (let k = i + 1; k < posed.length; k += 1) {
          const a = POSES[posed[i]!.id]!;
          const b = POSES[posed[k]!.id]!;
          if (a.view !== b.view) continue;
          const d = poseDistance(a, b);
          const sameMarks = isDeepStrictEqual(a.marks ?? [], b.marks ?? []);
          expect(
            d >= 6 || (d >= 3 && !sameMarks),
            `${movementId}: ${posed[i]!.id} and ${posed[k]!.id} D ${d.toFixed(2)}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("I7 motion: reps poses carry one or two arrows, holds none, each at least 10 long", () => {
    for (const [id, pose] of entries) {
      const found = arrows(pose);
      if (variation(id)!.type === "hold") {
        expect(found.length, `${id} hold has ${found.length} arrows`).toBe(0);
      } else {
        expect(
          found.length >= 1 && found.length <= 2,
          `${id} reps has ${found.length} arrows`,
        ).toBeTruthy();
      }
      for (const arrow of found) {
        const length = distance(point(arrow.from), point(arrow.to));
        expect(length >= 10, `${id} arrow length ${length}`).toBeTruthy();
      }
    }
  });

  it("I8 clear head: no limb segment comes closer than 4.5 to the head centre", () => {
    for (const [id, pose] of entries) {
      const j = figureJoints(pose);
      for (const segment of limbSegments(j)) {
        const gap = pointToSegment(j.head, segment);
        expect(
          gap >= 4.5,
          `${id} limb ${gap.toFixed(2)} from the head centre`,
        ).toBeTruthy();
      }
    }
  });

  it("I9 clear marks: arrows keep 3 from the body and 9 from the head centre", () => {
    for (const [id, pose] of entries) {
      const j = figureJoints(pose);
      const segments = bodySegments(pose, j);
      for (const arrow of arrows(pose)) {
        const from = point(arrow.from);
        const to = point(arrow.to);
        const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
        for (const p of [from, mid, to]) {
          const gap = Math.min(
            ...segments.map((segment) => pointToSegment(p, segment)),
          );
          expect(
            gap >= 3,
            `${id} arrow point ${p.x},${p.y} is ${gap.toFixed(2)} from the body`,
          ).toBeTruthy();
        }
        const headGap = pointToSegment(j.head, [from, to]);
        expect(
          headGap >= 9,
          `${id} arrow is ${headGap.toFixed(2)} from the head centre`,
        ).toBeTruthy();
      }
    }
  });

  it("I10a visible arms: every upper arm leaves the chest line by at least 15 degrees", () => {
    for (const [id, pose] of entries) {
      const c = pose.chest ?? pose.torso;
      pose.arms.forEach(([upperDeg], i) => {
        const off = Math.min(
          angleDiff(upperDeg, c),
          angleDiff(upperDeg, c + 180),
        );
        expect(
          off >= 15,
          `${id} arm ${i} is ${off} degrees off the chest line`,
        ).toBeTruthy();
      });
    }
  });

  it("I10b visible limbs: no long limb segment lies on another body line", () => {
    for (const [id, pose] of entries) {
      const j = figureJoints(pose);
      const long = longSegments(j);
      const torso = torsoSegments(j).map((seg, i): Named => ({
        limb: "torso",
        name: `half ${i}`,
        seg,
      }));
      for (const s of long) {
        const [a, b] = s.seg;
        const probes = [a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, b];
        for (const t of [
          ...torso,
          ...long.filter((other) => other.limb !== s.limb),
        ]) {
          if (sameEnds(s.seg, t.seg)) continue;
          const far = Math.max(...probes.map((p) => pointToSegment(p, t.seg)));
          expect(
            far >= 3,
            `${id} ${s.limb} ${s.name} lies on ${t.limb} ${t.name} (max gap ${far.toFixed(2)})`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("the redrawn pairs differ by at least 8", () => {
    const pairs: [string, string][] = [
      ["forearm-plank", "long-lever-plank"],
      ["long-lever-plank", "standing-walkout"],
      ["kneeling-sphinx-push-up", "kneeling-triceps-extension"],
      ["sphinx-push-up", "floor-triceps-extension"],
      ["mountain-climber", "cross-body-mountain-climber"],
      ["floor-triceps-extension", "forearm-plank"],
      ["push-up", "pseudo-planche-push-up"],
      ["push-up", "one-arm-push-up"],
      ["pseudo-planche-push-up", "one-arm-push-up"],
      ["side-plank", "side-plank-hip-dip"],
      ["side-plank", "side-plank-reach-under"],
      ["side-plank-hip-dip", "side-plank-reach-under"],
      ["wall-handstand-hold", "handstand-negative"],
      ["tuck-l-sit", "l-sit"],
    ];
    const close = pairs
      .map(([a, b]) => ({ a, b, d: poseDistance(POSES[a]!, POSES[b]!) }))
      .filter(({ d }) => d < 8)
      .map(({ a, b, d }) => `${a} and ${b} D ${d.toFixed(2)}`);
    expect(close).toStrictEqual([]);
  });

  it("wall handstands lean at least 18 degrees off the wall", () => {
    const upright = [
      "wall-handstand-hold",
      "handstand-negative",
      "wall-handstand-push-up",
    ]
      .map((id) => {
        const j = figureJoints(POSES[id]!);
        const ankle = j.legs[0]!.ankle;
        const lean =
          Math.atan2(Math.abs(ankle.x - j.shoulder.x), j.shoulder.y - ankle.y) *
          (180 / Math.PI);
        return { id, lean };
      })
      .filter(({ lean }) => lean < 18)
      .map(({ id, lean }) => `${id} leans ${lean.toFixed(1)}`);
    expect(upright).toStrictEqual([]);
  });
});
