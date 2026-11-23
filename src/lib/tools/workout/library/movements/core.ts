import type { MovementRow } from "../library";

export const CORE: MovementRow[] = [
  {
    id: "plank",
    pattern: "core",
    name: "Plank",
    startLevels: [0, 1, 2, 3, 3],
    variations: [
      [
        "knee-plank",
        "Knee plank",
        "H 15-45",
        "Forearms and knees down; keep a straight line from knees to head and squeeze your " +
          "glutes.",
      ],
      [
        "forearm-plank",
        "Forearm plank",
        "H 20-60",
        "Forearms and toes down; straight line from heels to head with your belly pulled in.",
      ],
      [
        "long-lever-plank",
        "Long-lever plank",
        "H 15-45",
        "Plank with your elbows a hand's length ahead of your shoulders; do not let your hips " +
          "sag.",
      ],
      [
        "kneeling-walkout",
        "Kneeling walkout",
        "R 4-10",
        "From kneeling, walk your hands forward as far as you can keep your hips level, then " +
          "walk back.",
      ],
      [
        "standing-walkout",
        "Standing walkout",
        "R 3-8",
        "From standing, fold and walk your hands out past your shoulders into a long plank, then " +
          "walk back up.",
      ],
    ],
  },
  {
    id: "leg-raise",
    pattern: "core",
    name: "Leg raise",
    startLevels: [0, 1, 2, 3, 4],
    variations: [
      [
        "dead-bug",
        "Dead bug",
        "R 5-12 /side",
        "On your back with arms and knees up; lower the opposite arm and leg while your lower " +
          "back stays on the floor.",
      ],
      [
        "lying-knee-raise",
        "Lying knee raise",
        "R 8-15",
        "On your back, pull both knees to your chest, then straighten your legs out just above " +
          "the floor.",
      ],
      [
        "lying-leg-raise",
        "Lying leg raise",
        "R 6-15",
        "On your back with legs straight; raise them to vertical and lower slowly without " +
          "arching your back.",
      ],
      [
        "hollow-hold",
        "Hollow hold",
        "H 15-45",
        "On your back, press your lower back down; lift your shoulders and straight legs just " +
          "off the floor.",
      ],
      [
        "v-up",
        "V-up",
        "R 5-12",
        "From lying flat, lift straight legs and chest together and reach for your toes.",
      ],
      [
        "tuck-l-sit",
        "Tuck L-sit",
        "H 10-25",
        "Sit with hands by your hips; push down to lift your hips and tucked knees off the floor.",
      ],
      [
        "l-sit",
        "L-sit",
        "H 5-20",
        "Hands by your hips, arms locked; lift your hips and hold both legs straight out off the " +
          "floor.",
      ],
    ],
  },
  {
    id: "side-plank",
    pattern: "core",
    name: "Side plank",
    startLevels: [0, 0, 1, 2, 3],
    variations: [
      [
        "knee-side-plank",
        "Knee side plank",
        "H 15-40 /side",
        "On one forearm and your bottom knee; lift your hips into a straight line.",
      ],
      [
        "side-plank",
        "Side plank",
        "H 15-45 /side",
        "On one forearm with feet stacked; lift your hips into a straight line from head to " +
          "heels.",
      ],
      [
        "side-plank-hip-dip",
        "Side plank hip dip",
        "R 6-15 /side",
        "From a side plank, lower your hip to just above the floor and lift it back up high.",
      ],
      [
        "side-plank-reach-under",
        "Side plank reach-under",
        "R 5-12 /side",
        "From a side plank, reach your top arm under your body and back up to the ceiling.",
      ],
      [
        "star-side-plank",
        "Star side plank",
        "H 10-30 /side",
        "Side plank on a straight arm with your top arm and top leg raised.",
      ],
    ],
  },
];
