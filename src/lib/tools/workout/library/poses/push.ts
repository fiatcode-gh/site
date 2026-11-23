import type { Pose } from "../figure";

export const PUSH_POSES: Record<string, Pose> = {
  "wall-push-up": {
    view: "side",
    wall: "right",
    hip: [82.5, 56],
    torso: 76,
    arms: [
      [356, 356],
      [356, 356],
    ],
    legs: [
      [256, 256, 0],
      [256, 256, 0],
    ],
    marks: [{ t: "arrow", from: [80, 13], to: [98, 13], both: true }],
  },
  "all-fours-push-up": {
    view: "side",
    hip: [53.5, 73],
    torso: 19,
    head: 7,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [270, 180, 180],
      [270, 180, 180],
    ],
    marks: [{ t: "arrow", from: [67.5, 45], to: [67.5, 59], both: true }],
  },
  "knee-push-up": {
    view: "side",
    hip: [62, 79.5],
    torso: 38,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [218, 158, 158],
      [218, 158, 158],
    ],
    marks: [{ t: "arrow", from: [72.5, 45], to: [72.5, 59], both: true }],
  },
  "push-up": {
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
    marks: [{ t: "arrow", from: [72.5, 45], to: [72.5, 59], both: true }],
  },
  "diamond-push-up": {
    view: "side",
    hip: [59, 74],
    torso: 18,
    arms: [
      [250, 250],
      [250, 250],
    ],
    legs: [
      [198, 198, 295],
      [198, 198, 295],
    ],
    marks: [
      { t: "arrow", from: [73, 46], to: [73, 60], both: true },
      { t: "line", from: [82.5, 77], to: [87, 83] },
      { t: "line", from: [87, 83], to: [82.5, 89] },
      { t: "line", from: [82.5, 89], to: [78, 83] },
      { t: "line", from: [78, 83], to: [82.5, 77] },
    ],
  },
  "archer-push-up": {
    view: "top",
    hip: [52, 50],
    torso: 0,
    arms: [
      [90, 90],
      [230, 325],
    ],
    legs: [
      [172, 172, 172],
      [188, 188, 188],
    ],
    marks: [{ t: "arrow", from: [97, 42], to: [97, 58], both: true }],
  },
  "pseudo-planche-push-up": {
    view: "side",
    hip: [59, 82.5],
    torso: 5,
    head: 20,
    arms: [
      [168, 264],
      [168, 264],
    ],
    legs: [
      [185, 185, 295],
      [185, 185, 295],
    ],
    marks: [{ t: "arrow", from: [74, 59.5], to: [74, 73.5], both: true }],
  },
  "one-arm-push-up": {
    view: "side",
    hip: [59, 73.5],
    torso: 20,
    arms: [
      [160, 255, 1, 0.8],
      [270, 270],
    ],
    legs: [
      [200, 200, 295],
      [200, 200, 295],
    ],
    marks: [{ t: "arrow", from: [101, 58], to: [101, 74], both: true }],
  },
  "pike-hold": {
    view: "side",
    hip: [51.5, 58.5],
    torso: 328,
    head: 262,
    arms: [
      [305, 305],
      [305, 305],
    ],
    legs: [
      [244, 244, 0],
      [244, 244, 0],
    ],
  },
  "pike-push-up": {
    view: "side",
    hip: [55.5, 58],
    torso: 305,
    head: 300,
    arms: [
      [190, 275],
      [190, 275],
    ],
    legs: [
      [246, 246, 0],
      [246, 246, 0],
    ],
    marks: [{ t: "arrow", from: [85.5, 66], to: [85.5, 82], both: true }],
  },
  "wall-walk": {
    view: "side",
    wall: "left",
    hip: [37.5, 50.5],
    torso: 315,
    head: 335,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [135, 135, 180],
      [135, 135, 180],
    ],
    marks: [{ t: "arrow", from: [22, 58], to: [22, 82], both: true }],
  },
  "wall-handstand-hold": {
    view: "side",
    wall: "right",
    hip: [93.5, 45.5],
    torso: 248,
    head: 215,
    arms: [
      [270, 270],
      [270, 270],
    ],
    legs: [
      [68, 68, 0],
      [68, 68, 0],
    ],
  },
  "handstand-negative": {
    view: "side",
    wall: "right",
    hip: [94.5, 49.5],
    torso: 250,
    head: 292,
    arms: [
      [226, 284],
      [226, 284],
    ],
    legs: [
      [70, 70, 0],
      [70, 70, 0],
    ],
    marks: [{ t: "arrow", from: [66, 38], to: [66, 56] }],
  },
  "wall-handstand-push-up": {
    view: "side",
    wall: "right",
    hip: [94.5, 54.5],
    torso: 250,
    head: 270,
    arms: [
      [195, 270],
      [195, 270],
    ],
    legs: [
      [70, 70, 0],
      [70, 70, 0],
    ],
    marks: [{ t: "arrow", from: [64, 43], to: [64, 61], both: true }],
  },
  "cobra-press": {
    view: "side",
    hip: [66, 90],
    torso: 35,
    chest: 80,
    head: 75,
    arms: [
      [315, 315],
      [315, 315],
    ],
    legs: [
      [180, 180, 180],
      [180, 180, 180],
    ],
    marks: [{ t: "arrow", from: [66, 56], to: [66, 70], both: true }],
  },
  "kneeling-sphinx-push-up": {
    view: "side",
    hip: [61, 80],
    torso: 31,
    arms: [
      [300, 300],
      [300, 300],
    ],
    legs: [
      [211, 158, 158],
      [211, 158, 158],
    ],
    marks: [{ t: "arrow", from: [73, 47.5], to: [73, 61.5], both: true }],
  },
  "sphinx-push-up": {
    view: "side",
    hip: [57, 75],
    torso: 17,
    arms: [
      [300, 300],
      [300, 300],
    ],
    legs: [
      [197, 197, 295],
      [197, 197, 295],
    ],
    marks: [{ t: "arrow", from: [71, 47.5], to: [71, 61.5], both: true }],
  },
  "kneeling-triceps-extension": {
    view: "side",
    hip: [57.5, 86.5],
    torso: 11,
    head: 29,
    arms: [
      [320, 0],
      [320, 0],
    ],
    legs: [
      [191, 158, 158],
      [191, 158, 158],
    ],
    marks: [{ t: "arrow", from: [72, 61.5], to: [72, 75.5], both: true }],
  },
  "floor-triceps-extension": {
    view: "side",
    hip: [50, 80.5],
    torso: 8,
    head: 30,
    arms: [
      [328, 328],
      [328, 328],
    ],
    legs: [
      [188, 188, 295],
      [188, 188, 295],
    ],
    marks: [{ t: "arrow", from: [65, 56.5], to: [65, 70.5], both: true }],
  },
  "tiger-bend-push-up": {
    view: "side",
    hip: [55.5, 61],
    torso: 310,
    head: 350,
    arms: [
      [270, 0],
      [270, 0],
    ],
    legs: [
      [236, 236, 0],
      [236, 236, 0],
    ],
    marks: [{ t: "arrow", from: [73.5, 56], to: [73.5, 70], both: true }],
  },
};
