<script lang="ts">
  import type { WeekDay } from "@/lib/tools/workout/tracking/tracking";
  import { dateFromKey, shortWeekday, weekDayLabel } from "./text";

  let { days }: { days: WeekDay[] } = $props();
</script>

<div class="flex flex-col gap-2">
  <ol
    data-wk="week-strip"
    aria-label="Last seven days"
    class="grid grid-cols-7 gap-1"
  >
    {#each days as day (day.dateKey)}
      <li
        class={[
          "flex min-w-0 flex-col items-center gap-0.5 border border-line py-1.5 font-mono text-xs",
          day.active ? "bg-mark font-bold text-fg" : "bg-raised text-muted",
          day.isToday && "ring-2 ring-inset ring-fg",
        ]}
      >
        <span class="sr-only">{weekDayLabel(day)}</span>
        <span
          aria-hidden="true"
          class={[
            day.dayType === "recovery" &&
              "underline decoration-dotted decoration-2 underline-offset-4",
          ]}>{shortWeekday(day.dateKey)}</span
        >
        <span aria-hidden="true" class="text-sm text-fg"
          >{dateFromKey(day.dateKey).getDate()}</span
        >
        <span aria-hidden="true" class="h-4 leading-4 text-fg"
          >{day.active ? "✓" : ""}</span
        >
      </li>
    {/each}
  </ol>
  <p
    aria-hidden="true"
    class="flex flex-wrap gap-x-[1ch] font-mono text-xs text-faint"
  >
    <span class="whitespace-nowrap">✓ trained ·</span>
    <span class="whitespace-nowrap">ring: today ·</span>
    <span class="whitespace-nowrap">dotted: recovery day</span>
  </p>
</div>
