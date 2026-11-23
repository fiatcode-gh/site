import type { Pose } from "../figure";

export const BACK_POSES: Record<string, Pose> = {
  "bird-dog": {
    view: "side",
    hip: [50, 73],
    torso: 19,
    head: 45,
    arms: [
      [270, 270],
      [0, 0],
    ],
    legs: [
      [180, 180, 180],
      [270, 180, 180],
    ],
    marks: [{ t: "arrow", from: [88, 56], to: [102, 56], both: true }],
  },
  "prone-chest-lift": {
    view: "side",
    hip: [57, 90],
    torso: 4,
    chest: 32,
    head: 60,
    arms: [
      [172, 172],
      [172, 172],
    ],
    legs: [
      [180, 180, 180],
      [180, 180, 180],
    ],
    marks: [{ t: "arrow", from: [82, 50], to: [82, 64], both: true }],
  },
  superman: {
    view: "side",
    hip: [57, 90],
    torso: 4,
    chest: 18,
    head: 45,
    arms: [
      [0, 0],
      [0, 0],
    ],
    legs: [
      [172, 172, 172],
      [172, 172, 172],
    ],
    marks: [
      { t: "arrow", from: [99.5, 64], to: [99.5, 78], both: true },
      { t: "arrow", from: [25.5, 65], to: [25.5, 79], both: true },
    ],
  },
  "superman-hold": {
    view: "side",
    hip: [57.5, 90],
    torso: 10,
    chest: 34,
    head: 60,
    arms: [
      [15, 15],
      [15, 15],
    ],
    legs: [
      [164, 164, 164],
      [164, 164, 164],
    ],
  },
  "reverse-snow-angel": {
    view: "side",
    hip: [57.5, 90],
    torso: 10,
    chest: 34,
    head: 60,
    arms: [
      [15, 15],
      [172, 172],
    ],
    legs: [
      [164, 164, 164],
      [164, 164, 164],
    ],
    marks: [{ t: "arrow", from: [63.5, 62], to: [91.5, 62], both: true }],
  },
  "arch-rock": {
    view: "side",
    hip: [55, 85],
    torso: 340,
    chest: 0,
    head: 60,
    arms: [
      [15, 15],
      [15, 15],
    ],
    legs: [
      [150, 150, 150],
      [150, 150, 150],
    ],
    marks: [
      { t: "arrow", from: [94, 62], to: [94, 76], both: true },
      { t: "arrow", from: [24, 46], to: [24, 60], both: true },
    ],
  },
  "glute-bridge": {
    view: "side",
    hip: [67, 78.5],
    torso: 203,
    head: 160,
    arms: [
      [353, 353],
      [353, 353],
    ],
    legs: [
      [23, 270, 0],
      [23, 270, 0],
    ],
    marks: [{ t: "arrow", from: [67, 58.5], to: [67, 72.5], both: true }],
  },
  "marching-bridge": {
    view: "side",
    hip: [67, 78.5],
    torso: 203,
    head: 160,
    arms: [
      [353, 353],
      [353, 353],
    ],
    legs: [
      [90, 0, 0],
      [23, 270, 0],
    ],
    marks: [{ t: "arrow", from: [59, 51], to: [59, 65], both: true }],
  },
  "single-leg-bridge": {
    view: "side",
    hip: [67, 81.5],
    torso: 194,
    head: 160,
    arms: [
      [353, 353],
      [353, 353],
    ],
    legs: [
      [14, 14, 14],
      [35, 270, 0],
    ],
    marks: [{ t: "arrow", from: [65, 61], to: [65, 75], both: true }],
  },
  "hamstring-walkout": {
    view: "side",
    hip: [52, 86.5],
    torso: 174,
    head: 180,
    arms: [
      [330, 0],
      [330, 0],
    ],
    legs: [
      [10, 340, 70],
      [10, 340, 70],
    ],
    marks: [{ t: "arrow", from: [70, 74], to: [84, 74], both: true }],
  },
  "long-single-leg-bridge": {
    view: "side",
    hip: [60, 82],
    torso: 186,
    head: 175,
    arms: [
      [330, 0],
      [330, 0],
    ],
    legs: [
      [50, 50, 140],
      [12, 322, 70],
    ],
    marks: [{ t: "arrow", from: [58, 61], to: [58, 75], both: true }],
  },
  "tabletop-hold": {
    view: "side",
    hip: [67, 69.5],
    torso: 171,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [351, 270, 0],
      [351, 270, 0],
    ],
  },
  "reverse-plank": {
    view: "side",
    hip: [60, 75],
    torso: 155,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [335, 335, 65],
      [335, 335, 65],
    ],
  },
  "single-leg-reverse-plank": {
    view: "side",
    hip: [60, 75],
    torso: 155,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [15, 15, 15],
      [335, 335, 65],
    ],
  },
  "bridge-hold": {
    view: "side",
    hip: [63.5, 68],
    torso: 150,
    chest: 215,
    head: 268,
    arms: [
      [232, 232],
      [232, 232],
    ],
    legs: [
      [345, 285, 0],
      [345, 285, 0],
    ],
  },
  "bridge-push-up": {
    view: "side",
    hip: [63.5, 70],
    torso: 160,
    chest: 230,
    head: 268,
    arms: [
      [200, 290],
      [200, 290],
    ],
    legs: [
      [350, 280, 0],
      [350, 280, 0],
    ],
    marks: [{ t: "arrow", from: [52, 44], to: [52, 58], both: true }],
  },
  "wall-walk-bridge": {
    view: "side",
    wall: "left",
    hip: [43, 55],
    torso: 100,
    chest: 145,
    head: 90,
    arms: [
      [175, 175],
      [175, 175],
    ],
    legs: [
      [275, 275, 0],
      [275, 275, 0],
    ],
    marks: [{ t: "arrow", from: [24, 62], to: [24, 80], both: true }],
  },
};
