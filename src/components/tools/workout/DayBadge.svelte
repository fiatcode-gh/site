<script lang="ts">
  import type { DayType } from "@/lib/tools/workout/types";
  import { DAY_TYPE_LABELS } from "./text";

  let { dayType }: { dayType: DayType } = $props();
</script>

<p
  data-wk="day-badge"
  class={[
    "inline-block self-start px-2.5 py-1 font-mono text-xs font-semibold text-fg",
    dayType === "recovery"
      ? "border border-dashed border-fg"
      : "border border-solid border-line-strong",
  ]}
>
  {DAY_TYPE_LABELS[dayType]}
</p>
