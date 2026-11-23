import type { MovementRow } from "../library";

export const CONDITIONING: MovementRow[] = [
  {
    id: "burpee",
    pattern: "conditioning",
    name: "Burpee",
    startLevels: [0, 1, 2, 3, 3],
    variations: [
      [
        "step-back-squat-thrust",
        "Step-back squat thrust",
        "R 5-12",
        "Squat, hands to the floor, step back to a plank one foot at a time, step in and stand.",
      ],
      [
        "squat-thrust",
        "Squat thrust",
        "R 6-15",
        "Squat, hands to the floor, jump both feet back to a plank, jump them in and stand.",
      ],
      [
        "burpee",
        "Burpee",
        "R 6-15",
        "Do a squat thrust, then jump straight up with your arms overhead.",
      ],
      [
        "push-up-burpee",
        "Push-up burpee",
        "R 5-15",
        "Jump back, do one push-up, jump in, and jump up.",
      ],
      [
        "tuck-jump-burpee",
        "Tuck jump burpee",
        "R 5-12",
        "A push-up burpee that ends with a jump pulling both knees to your chest.",
      ],
    ],
  },
  {
    id: "jumps",
    pattern: "conditioning",
    name: "Jumps",
    startLevels: [0, 1, 2, 2, 3],
    variations: [
      [
        "step-jack",
        "Step jack",
        "R 15-40",
        "Step one foot out to the side as your arms go overhead, then the other; no jumping.",
      ],
      [
        "jumping-jack",
        "Jumping jack",
        "R 20-50",
        "Jump your feet wide as your arms go overhead, then jump back together; land softly.",
      ],
      [
        "squat-jack",
        "Squat jack",
        "R 12-30",
        "Stay low in a half squat and jump your feet wide and back together.",
      ],
      [
        "star-jump",
        "Star jump",
        "R 8-20",
        "From a quarter squat, jump up and spread arms and legs into a star; land soft and sink " +
          "again.",
      ],
      [
        "tuck-jump",
        "Tuck jump",
        "R 6-15",
        "Jump as high as you can and pull both knees to your chest; land quietly.",
      ],
    ],
  },
  {
    id: "mountain-climber",
    pattern: "conditioning",
    name: "Mountain climber",
    startLevels: [0, 1, 2, 3, 3],
    variations: [
      [
        "marching-high-knees",
        "Marching high knees",
        "R 20-50",
        "March on the spot, lifting each knee to hip height and swinging the opposite arm.",
      ],
      [
        "step-mountain-climber",
        "Step mountain climber",
        "R 16-40",
        "In a push-up position, step one foot up toward your hands and back, then the other.",
      ],
      [
        "mountain-climber",
        "Mountain climber",
        "R 20-50",
        "In a push-up position, run your knees toward your chest with your hips low.",
      ],
      [
        "cross-body-mountain-climber",
        "Cross-body mountain climber",
        "R 16-40",
        "In a push-up position, drive each knee toward the opposite elbow.",
      ],
      [
        "plank-frog-hop",
        "Plank frog hop",
        "R 8-20",
        "From a push-up position, jump both feet up outside your hands and back out.",
      ],
    ],
  },
];
