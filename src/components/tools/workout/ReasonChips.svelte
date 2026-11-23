<script lang="ts">
  import { REASONS, type Reason } from "@/lib/tools/workout/core/reasons";
  import { PAIN_NOTE, reasonChipLabel } from "./text";

  let { onchange }: { onchange: (reasons: Reason[]) => void } = $props();

  let selected: Reason[] = $state.raw([]);

  function toggle(reason: Reason) {
    const next = selected.includes(reason)
      ? selected.filter((r) => r !== reason)
      : [...selected, reason];
    selected = REASONS.filter((r) => next.includes(r));
    onchange(selected);
  }
</script>

<div class="mt-4 flex flex-col gap-3">
  <ul aria-label="Reasons (optional)" class="flex flex-wrap gap-2">
    {#each REASONS as reason (reason)}
      {@const pressed = selected.includes(reason)}
      <li>
        <button
          type="button"
          aria-pressed={pressed}
          class={[
            "tool-btn min-h-12 min-w-12 text-fg",
            pressed &&
              "bg-select font-bold shadow-[inset_0_0_0_2px_var(--color-active)] hover:bg-select",
          ]}
          onclick={() => toggle(reason)}>{reasonChipLabel(reason)}</button
        >
      </li>
    {/each}
  </ul>
  <div role="status">
    {#if selected.includes("pain")}
      <p class="tool-error">{PAIN_NOTE}</p>
    {/if}
  </div>
</div>
