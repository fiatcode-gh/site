import type { Pose } from "../figure";

export const LEGS_POSES: Record<string, Pose> = {
  "supported-squat": {
    view: "side",
    wall: "right",
    hip: [82, 61],
    torso: 80,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [315, 250, 0],
      [315, 250, 0],
    ],
    marks: [{ t: "arrow", from: [72, 48], to: [72, 64], both: true }],
  },
  squat: {
    view: "side",
    hip: [42, 73.5],
    torso: 58,
    arms: [
      [355, 355],
      [355, 355],
    ],
    legs: [
      [2, 252, 0],
      [2, 252, 0],
    ],
    marks: [{ t: "arrow", from: [33, 53.5], to: [33, 69.5], both: true }],
  },
  "close-squat": {
    view: "side",
    hip: [45, 81.5],
    torso: 55,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [25, 240, 0],
      [25, 240, 0],
    ],
    marks: [{ t: "arrow", from: [35, 60], to: [35, 76], both: true }],
  },
  "cossack-squat": {
    view: "front",
    hip: [55, 66],
    torso: 92,
    arms: [
      [240, 0],
      [300, 180],
    ],
    legs: [
      [200, 265, 180],
      [317, 317, 60],
    ],
    marks: [{ t: "arrow", from: [82, 46], to: [82, 62], both: true }],
  },
  "assisted-pistol-squat": {
    view: "side",
    wall: "left",
    hip: [25, 82.5],
    torso: 66,
    arms: [
      [185, 185],
      [8, 8],
    ],
    legs: [
      [32, 248, 0],
      [4, 4, 80],
    ],
    marks: [{ t: "arrow", from: [52, 36], to: [52, 52], both: true }],
  },
  "pistol-squat": {
    view: "side",
    hip: [42, 82.5],
    torso: 66,
    arms: [
      [8, 8],
      [8, 8],
    ],
    legs: [
      [32, 248, 0],
      [4, 4, 80],
    ],
    marks: [{ t: "arrow", from: [33, 60.5], to: [33, 76.5], both: true }],
  },
  "supported-split-squat": {
    view: "side",
    wall: "right",
    hip: [86, 72],
    torso: 90,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [0, 270, 0],
      [242, 172, 300],
    ],
    marks: [{ t: "arrow", from: [76, 48], to: [76, 64], both: true }],
  },
  "split-squat": {
    view: "side",
    hip: [55, 72],
    torso: 90,
    arms: [
      [225, 305],
      [225, 305],
    ],
    legs: [
      [0, 270, 0],
      [242, 172, 300],
    ],
    marks: [{ t: "arrow", from: [40, 46], to: [40, 62], both: true }],
  },
  "reverse-lunge": {
    view: "side",
    hip: [62, 72.5],
    torso: 80,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [2, 268, 0],
      [218, 185, 300],
    ],
    marks: [{ t: "arrow", from: [23, 72], to: [37, 72], both: true }],
  },
  "assisted-skater-squat": {
    view: "side",
    wall: "right",
    hip: [75, 71.5],
    torso: 60,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [355, 250, 0],
      [245, 160, 180],
    ],
    marks: [{ t: "arrow", from: [64, 48], to: [64, 64], both: true }],
  },
  "skater-squat": {
    view: "side",
    hip: [50, 71.5],
    torso: 60,
    arms: [
      [340, 340],
      [340, 340],
    ],
    legs: [
      [355, 250, 0],
      [245, 160, 180],
    ],
    marks: [{ t: "arrow", from: [39, 48], to: [39, 64], both: true }],
  },
  "shrimp-squat": {
    view: "side",
    hip: [52, 71.5],
    torso: 72,
    arms: [
      [0, 0],
      [220, 200],
    ],
    legs: [
      [355, 250, 0],
      [232, 108, 90],
    ],
    marks: [{ t: "arrow", from: [30, 44], to: [30, 60], both: true }],
  },
  "high-wall-sit": {
    view: "side",
    wall: "left",
    hip: [14, 62],
    torso: 90,
    arms: [
      [290, 290],
      [290, 290],
    ],
    legs: [
      [325, 270, 0],
      [325, 270, 0],
    ],
  },
  "wall-sit": {
    view: "side",
    wall: "left",
    hip: [14, 72],
    torso: 90,
    arms: [
      [290, 290],
      [290, 290],
    ],
    legs: [
      [0, 270, 0],
      [0, 270, 0],
    ],
  },
  "tiptoe-wall-sit": {
    view: "side",
    wall: "left",
    hip: [14, 67],
    torso: 90,
    arms: [
      [290, 290],
      [290, 290],
    ],
    legs: [
      [0, 270, 285],
      [0, 270, 285],
    ],
    marks: [
      { t: "line", from: [26.5, 86.5], to: [26.5, 90] },
      { t: "line", from: [29, 86.5], to: [29, 90] },
    ],
  },
  "single-leg-wall-sit": {
    view: "side",
    wall: "left",
    hip: [14, 72],
    torso: 90,
    arms: [
      [290, 290],
      [290, 290],
    ],
    legs: [
      [0, 0, 90],
      [0, 270, 0],
    ],
  },
  "assisted-sissy-squat": {
    view: "side",
    wall: "left",
    hip: [43, 60.5],
    torso: 120,
    arms: [
      [185, 185],
      [0, 0],
    ],
    legs: [
      [300, 225, 330],
      [300, 225, 330],
    ],
    marks: [{ t: "arrow", from: [49, 46], to: [49, 62], both: true }],
  },
  "sissy-squat": {
    view: "side",
    hip: [55, 60.5],
    torso: 120,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [300, 225, 330],
      [300, 225, 330],
    ],
    marks: [{ t: "arrow", from: [61, 46], to: [61, 62], both: true }],
  },
};
