<script lang="ts">
  import { finishPlacement } from "@/lib/tools/workout/app/actions";
  import { defaultState } from "@/lib/tools/workout/storage/schema";
  import type { DateKey } from "@/lib/tools/workout/types";
  import { setWorkoutApp, type WorkoutApp } from "./app.svelte";
  import TodayScreen from "./TodayScreen.svelte";

  let { dateKey }: { dateKey: DateKey } = $props();

  const noop = () => {};
  const specimen: WorkoutApp = {
    state: finishPlacement(defaultState(), {
      push: 12,
      legs: 30,
      core: 50,
      back: 20,
      conditioning: 12,
    }),
    problem: null,
    route: { name: "today", param: null },
    get today() {
      return dateKey;
    },
    announcement: "",
    clock: { now: () => 0, today: () => dateKey },
    cues: { unlock: noop, play: noop },
    dispatch: noop,
    replaceAll: noop,
    resetAll: noop,
    navigate: noop,
    announce: noop,
    destroy: noop,
  };
  setWorkoutApp(() => specimen);
</script>

<TodayScreen />
