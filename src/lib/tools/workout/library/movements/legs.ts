import type { MovementRow } from "../library";

export const LEGS: MovementRow[] = [
  {
    id: "squat",
    pattern: "legs",
    name: "Squat",
    startLevels: [0, 1, 2, 3, 4],
    variations: [
      [
        "supported-squat",
        "Supported half squat",
        "R 8-20",
        "One hand on the wall; sit back until your thighs are halfway to level, then stand tall.",
      ],
      [
        "squat",
        "Squat",
        "R 10-25",
        "Feet shoulder-width; sit down until your thighs are level, knees tracking over your " +
          "toes.",
      ],
      [
        "close-squat",
        "Close squat",
        "R 8-20",
        "Feet together; sit as deep as you can while keeping your heels down.",
      ],
      [
        "cossack-squat",
        "Cossack squat",
        "R 5-12 /side",
        "Wide stance; sink onto one heel while the other leg stays straight, then push back to " +
          "the middle.",
      ],
      [
        "assisted-pistol-squat",
        "Assisted pistol squat",
        "R 3-8 /side",
        "Fingertips on the wall; lower on one leg with the other held out in front, then stand.",
      ],
      [
        "pistol-squat",
        "Pistol squat",
        "R 3-8 /side",
        "On one leg with the free leg straight out in front; sit all the way down and stand " +
          "without touching down.",
      ],
    ],
  },
  {
    id: "lunge",
    pattern: "legs",
    name: "Lunge",
    startLevels: [0, 1, 2, 2, 3],
    variations: [
      [
        "supported-split-squat",
        "Supported split squat",
        "R 6-12 /side",
        "One hand on the wall, feet split front and back; lower your back knee toward the floor.",
      ],
      [
        "split-squat",
        "Split squat",
        "R 6-15 /side",
        "Feet split front and back; lower straight down until your back knee almost touches.",
      ],
      [
        "reverse-lunge",
        "Reverse lunge",
        "R 6-15 /side",
        "Step one foot back, lower the back knee to just above the floor, then drive up to " +
          "standing.",
      ],
      [
        "assisted-skater-squat",
        "Assisted skater squat",
        "R 4-10 /side",
        "Fingertips on the wall; on one leg, lower your back knee to tap the floor while that " +
          "foot stays off the ground.",
      ],
      [
        "skater-squat",
        "Skater squat",
        "R 4-10 /side",
        "On one leg, reach your arms forward and lower your back knee to tap the floor; the back " +
          "foot never touches.",
      ],
      [
        "shrimp-squat",
        "Shrimp squat",
        "R 3-8 /side",
        "Hold your back foot behind you with one hand; lower on the other leg until the back " +
          "knee touches.",
      ],
    ],
  },
  {
    id: "wall-sit",
    pattern: "legs",
    name: "Wall sit",
    startLevels: [0, 1, 1, 2, 3],
    variations: [
      [
        "high-wall-sit",
        "High wall sit",
        "H 15-45",
        "Back flat on the wall, slide down a third of the way; keep your heels pressed into the " +
          "floor.",
      ],
      [
        "wall-sit",
        "Wall sit",
        "H 20-60",
        "Back flat on the wall, thighs level with the floor, knees above your ankles.",
      ],
      [
        "tiptoe-wall-sit",
        "Tiptoe wall sit",
        "H 15-45",
        "Hold a wall sit with both heels raised as high as you can.",
      ],
      [
        "single-leg-wall-sit",
        "Single-leg wall sit",
        "H 10-30 /side",
        "Hold a wall sit and stretch one leg straight out in front.",
      ],
      [
        "assisted-sissy-squat",
        "Assisted sissy squat",
        "R 4-10",
        "Fingertips on the wall, heels raised; push your knees forward and lean back in one line " +
          "from knees to shoulders.",
      ],
      [
        "sissy-squat",
        "Sissy squat",
        "R 4-10",
        "Heels raised; push your knees forward and lean back in one straight line from knees to " +
          "shoulders, then rise.",
      ],
    ],
  },
];
