import type { Pose } from "../figure";

export const CONDITIONING_POSES: Record<string, Pose> = {
  "step-back-squat-thrust": {
    view: "side",
    hip: [57, 68],
    torso: 5,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [320, 216, 0],
      [210, 210, 295],
    ],
    marks: [{ t: "arrow", from: [26, 70], to: [40, 70], both: true }],
  },
  "squat-thrust": {
    view: "side",
    hip: [59, 73.5],
    torso: 20,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [200, 200, 295],
      [200, 200, 295],
    ],
    marks: [{ t: "arrow", from: [28, 65.5], to: [45, 65.5], both: true }],
  },
  burpee: {
    view: "side",
    air: true,
    hip: [60, 46],
    torso: 90,
    arms: [
      [58, 58],
      [122, 122],
    ],
    legs: [
      [280, 240, 280],
      [280, 240, 280],
    ],
    marks: [{ t: "arrow", from: [44, 62], to: [44, 42] }],
  },
  "push-up-burpee": {
    view: "side",
    hip: [59, 77.5],
    torso: 13,
    arms: [
      [227, 313],
      [227, 313],
    ],
    legs: [
      [193, 193, 295],
      [193, 193, 295],
    ],
    marks: [{ t: "arrow", from: [73.5, 51.5], to: [73.5, 65.5], both: true }],
  },
  "tuck-jump-burpee": {
    view: "side",
    air: true,
    hip: [56, 62],
    torso: 85,
    head: 90,
    arms: [
      [58, 58],
      [122, 122],
    ],
    legs: [
      [25, 268, 320],
      [25, 268, 320],
    ],
    marks: [{ t: "arrow", from: [40, 74], to: [40, 54] }],
  },
  "step-jack": {
    view: "front",
    hip: [58, 55],
    torso: 90,
    arms: [
      [125, 125],
      [55, 55],
    ],
    legs: [
      [270, 270, 180],
      [302, 302, 330],
    ],
    marks: [{ t: "arrow", from: [90, 80], to: [104, 80], both: true }],
  },
  "jumping-jack": {
    view: "front",
    hip: [60, 57.5],
    torso: 90,
    arms: [
      [125, 125],
      [55, 55],
    ],
    legs: [
      [248, 248, 180],
      [292, 292, 0],
    ],
    marks: [{ t: "arrow", from: [88, 84], to: [102, 84], both: true }],
  },
  "squat-jack": {
    view: "front",
    hip: [60, 61],
    torso: 90,
    arms: [
      [235, 5],
      [305, 175],
    ],
    legs: [
      [220, 265, 180],
      [320, 275, 0],
    ],
    marks: [{ t: "arrow", from: [90, 82], to: [104, 82], both: true }],
  },
  "star-jump": {
    view: "front",
    air: true,
    hip: [60, 52],
    torso: 90,
    arms: [
      [145, 145],
      [35, 35],
    ],
    legs: [
      [235, 235, 200],
      [305, 305, 340],
    ],
    marks: [{ t: "arrow", from: [84, 58], to: [84, 42] }],
  },
  "tuck-jump": {
    view: "side",
    air: true,
    hip: [54, 58],
    torso: 88,
    arms: [
      [55, 55],
      [121, 121],
    ],
    legs: [
      [15, 265, 340],
      [15, 265, 340],
    ],
    marks: [{ t: "arrow", from: [36, 80], to: [36, 60] }],
  },
  "marching-high-knees": {
    view: "side",
    hip: [52, 55],
    torso: 90,
    arms: [
      [225, 260],
      [45, 80],
    ],
    legs: [
      [0, 270, 330],
      [270, 270, 0],
    ],
    marks: [{ t: "arrow", from: [82, 48], to: [82, 62], both: true }],
  },
  "step-mountain-climber": {
    view: "side",
    hip: [59, 73.5],
    torso: 20,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [4, 254, 0],
      [200, 200, 295],
    ],
    marks: [{ t: "arrow", from: [52, 84], to: [64, 84], both: true }],
  },
  "mountain-climber": {
    view: "side",
    hip: [59, 73.5],
    torso: 20,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [330, 190, 250],
      [200, 200, 295],
    ],
    marks: [{ t: "arrow", from: [38, 86.5], to: [50, 86.5], both: true }],
  },
  "cross-body-mountain-climber": {
    view: "side",
    hip: [59, 73.5],
    torso: 20,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [200, 200, 295],
      [352, 228, 200, 1, 0.9],
    ],
    marks: [{ t: "arrow", from: [48, 62], to: [60, 54], both: true }],
  },
  "plank-frog-hop": {
    view: "side",
    hip: [50, 58],
    torso: 339,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [330, 255, 290],
      [330, 255, 290],
    ],
    marks: [{ t: "arrow", from: [34, 84], to: [48, 84], both: true }],
  },
};
