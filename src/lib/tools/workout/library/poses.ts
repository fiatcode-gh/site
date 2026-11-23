import type { Pose } from "./figure";
import { BACK_POSES } from "./poses/back";
import { CONDITIONING_POSES } from "./poses/conditioning";
import { CORE_POSES } from "./poses/core";
import { LEGS_POSES } from "./poses/legs";
import { PUSH_POSES } from "./poses/push";

export const POSES: Readonly<Record<string, Pose>> = Object.freeze({
  ...PUSH_POSES,
  ...LEGS_POSES,
  ...CORE_POSES,
  ...BACK_POSES,
  ...CONDITIONING_POSES,
});

export function poseFor(variationId: string): Pose | undefined {
  return Object.hasOwn(POSES, variationId) ? POSES[variationId] : undefined;
}
