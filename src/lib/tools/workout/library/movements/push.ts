import type { MovementRow } from "../library";

export const PUSH: MovementRow[] = [
  {
    id: "push-up",
    pattern: "push",
    name: "Push-up",
    startLevels: [0, 2, 3, 4, 5],
    variations: [
      [
        "wall-push-up",
        "Wall push-up",
        "R 8-20",
        "Hands on the wall at chest height; keep your body straight and bring your nose to the " +
          "wall.",
      ],
      [
        "all-fours-push-up",
        "All-fours push-up",
        "R 6-15",
        "On hands and knees with hips above knees; bend your elbows to lower your nose between " +
          "your hands.",
      ],
      [
        "knee-push-up",
        "Knee push-up",
        "R 6-15",
        "Knees down, straight line from knees to head; lower your chest to the floor.",
      ],
      [
        "push-up",
        "Push-up",
        "R 5-15",
        "Straight line from heels to head; lower your chest to just above the floor.",
      ],
      [
        "diamond-push-up",
        "Diamond push-up",
        "R 5-12",
        "Thumbs and forefingers touching under your chest; keep your elbows close to your ribs.",
      ],
      [
        "archer-push-up",
        "Archer push-up",
        "R 4-10 /side",
        "Hands wide; bend one arm and keep the other straight as you lower toward the bent side.",
      ],
      [
        "pseudo-planche-push-up",
        "Pseudo planche push-up",
        "R 4-10",
        "Hands by your waist with fingers turned out; lean your shoulders ahead of your hands " +
          "and lower.",
      ],
      [
        "one-arm-push-up",
        "One-arm push-up",
        "R 3-8 /side",
        "Feet wide, one hand under your shoulder, the other behind your back; lower without " +
          "twisting.",
      ],
    ],
  },
  {
    id: "overhead-push",
    pattern: "push",
    name: "Overhead push",
    startLevels: [0, 0, 1, 1, 2],
    variations: [
      [
        "pike-hold",
        "Pike hold",
        "H 15-45",
        "Hands and feet on the floor, hips high in an upside-down V; push the floor away.",
      ],
      [
        "pike-push-up",
        "Pike push-up",
        "R 5-12",
        "From the upside-down V, bend your elbows to lower the top of your head toward the floor.",
      ],
      [
        "wall-walk",
        "Wall walk",
        "R 2-6",
        "From a push-up position with feet at the wall, walk your feet up and hands in, then " +
          "back down slowly.",
      ],
      [
        "wall-handstand-hold",
        "Wall handstand hold",
        "H 15-60",
        "Chest facing the wall, arms locked, ribs pulled in; push tall through your shoulders.",
      ],
      [
        "handstand-negative",
        "Handstand push-up negative",
        "R 2-6",
        "From a wall handstand, lower your head to the floor as slowly as you can, then come " +
          "down.",
      ],
      [
        "wall-handstand-push-up",
        "Wall handstand push-up",
        "R 2-8",
        "From a wall handstand, lower your head to the floor and press back up to locked arms.",
      ],
    ],
  },
  {
    id: "triceps-press",
    pattern: "push",
    name: "Triceps press",
    startLevels: [0, 0, 1, 2, 3],
    variations: [
      [
        "cobra-press",
        "Cobra press",
        "R 8-15",
        "Lie face down with hands under your shoulders; press your chest up and leave your hips " +
          "on the floor.",
      ],
      [
        "kneeling-sphinx-push-up",
        "Kneeling sphinx push-up",
        "R 5-12",
        "Forearms and knees on the floor; press through your palms until your arms are straight.",
      ],
      [
        "sphinx-push-up",
        "Sphinx push-up",
        "R 5-12",
        "From a forearm plank, press through your palms until your arms are straight, then lower " +
          "both elbows together.",
      ],
      [
        "kneeling-triceps-extension",
        "Kneeling triceps extension",
        "R 5-12",
        "Knees down, hands a forearm's length ahead of your shoulders; lower your elbows to the " +
          "floor and press back up.",
      ],
      [
        "floor-triceps-extension",
        "Floor triceps extension",
        "R 4-10",
        "On your toes with hands ahead of your shoulders; lower both elbows to the floor and " +
          "press back up.",
      ],
      [
        "tiger-bend-push-up",
        "Tiger bend push-up",
        "R 3-8",
        "From a pike, lower both forearms to the floor, then press back up to straight arms.",
      ],
    ],
  },
];
