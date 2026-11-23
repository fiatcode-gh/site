import type { Pose } from "../figure";

export const CORE_POSES: Record<string, Pose> = {
  "knee-plank": {
    view: "side",
    hip: [62, 84.5],
    torso: 19,
    head: 28,
    arms: [
      [270, 0],
      [270, 0],
    ],
    legs: [
      [199, 158, 158],
      [199, 158, 158],
    ],
  },
  "forearm-plank": {
    view: "side",
    hip: [59, 80.5],
    torso: 8,
    head: 18,
    arms: [
      [270, 0],
      [270, 0],
    ],
    legs: [
      [188, 188, 295],
      [188, 188, 295],
    ],
  },
  "long-lever-plank": {
    view: "side",
    hip: [54, 83],
    torso: 4,
    head: 70,
    arms: [
      [325, 0],
      [325, 0],
    ],
    legs: [
      [184, 184, 295],
      [184, 184, 295],
    ],
    marks: [
      { t: "line", from: [76, 84.5], to: [76, 90] },
      { t: "line", from: [76, 90], to: [86, 90] },
    ],
  },
  "kneeling-walkout": {
    view: "side",
    hip: [55, 83.5],
    torso: 19,
    head: 35,
    arms: [
      [325, 325],
      [325, 325],
    ],
    legs: [
      [199, 158, 158],
      [199, 158, 158],
    ],
    marks: [{ t: "arrow", from: [84, 60], to: [98, 60], both: true }],
  },
  "standing-walkout": {
    view: "side",
    hip: [48, 60],
    torso: 330,
    head: 350,
    arms: [
      [310, 310],
      [310, 310],
    ],
    legs: [
      [240, 240, 0],
      [240, 240, 0],
    ],
    marks: [{ t: "arrow", from: [88, 84], to: [102, 84], both: true }],
  },
  "dead-bug": {
    view: "side",
    hip: [63, 84.5],
    torso: 180,
    head: 176,
    arms: [
      [143, 143],
      [90, 90],
    ],
    legs: [
      [14, 14, 80],
      [92, 2, 80],
    ],
    marks: [{ t: "arrow", from: [105, 58], to: [105, 74], both: true }],
  },
  "lying-knee-raise": {
    view: "side",
    hip: [63, 84.5],
    torso: 180,
    arms: [
      [330, 0],
      [330, 0],
    ],
    legs: [
      [115, 0, 10],
      [115, 0, 10],
    ],
    marks: [{ t: "arrow", from: [86, 66], to: [96, 78], both: true }],
  },
  "lying-leg-raise": {
    view: "side",
    hip: [63, 84.5],
    torso: 180,
    arms: [
      [330, 0],
      [330, 0],
    ],
    legs: [
      [90, 90, 0],
      [90, 90, 0],
    ],
    marks: [{ t: "arrow", from: [72, 56], to: [86, 56], both: true }],
  },
  "hollow-hold": {
    view: "side",
    hip: [63.5, 90],
    torso: 172,
    chest: 146,
    head: 115,
    arms: [
      [168, 168],
      [168, 168],
    ],
    legs: [
      [22, 22, 60],
      [22, 22, 60],
    ],
  },
  "v-up": {
    view: "side",
    hip: [55, 89],
    torso: 135,
    arms: [
      [5, 5],
      [5, 5],
    ],
    legs: [
      [45, 45, 45],
      [45, 45, 45],
    ],
    marks: [{ t: "arrow", from: [92, 40], to: [92, 56], both: true }],
  },
  "tuck-l-sit": {
    view: "side",
    hip: [46.5, 86],
    torso: 65,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [42, 335, 20],
      [42, 335, 20],
    ],
  },
  "l-sit": {
    view: "side",
    hip: [42, 86],
    torso: 65,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [5, 5, 80],
      [5, 5, 80],
    ],
  },
  "knee-side-plank": {
    view: "front",
    hip: [60.5, 78.5],
    torso: 24,
    arms: [
      [90, 90],
      [270, 0, 1, 0.45],
    ],
    legs: [
      [216, 150, 150],
      [204, 150, 150],
    ],
  },
  "side-plank": {
    view: "front",
    hip: [61, 73.5],
    torso: 17,
    arms: [
      [90, 90],
      [270, 0, 1, 0.45],
    ],
    legs: [
      [206, 206, 197],
      [197, 197, 197],
    ],
  },
  "side-plank-hip-dip": {
    view: "front",
    hip: [63.5, 83.5],
    torso: 42,
    arms: [
      [90, 90],
      [270, 0, 1, 0.45],
    ],
    legs: [
      [195, 195, 186],
      [184, 184, 184],
    ],
    marks: [{ t: "arrow", from: [60.5, 56], to: [60.5, 70], both: true }],
  },
  "side-plank-reach-under": {
    view: "front",
    hip: [61, 73.5],
    torso: 17,
    arms: [
      [265, 230],
      [270, 0, 1, 0.45],
    ],
    legs: [
      [206, 206, 197],
      [197, 197, 197],
    ],
    marks: [{ t: "arrow", from: [76.5, 39.5], to: [67.5, 52.5], both: true }],
  },
  "star-side-plank": {
    view: "front",
    hip: [62, 67],
    torso: 28,
    arms: [
      [90, 90],
      [270, 270],
    ],
    legs: [
      [150, 150, 150],
      [208, 208, 208],
    ],
  },
};
