<script lang="ts">
  import { suggestionText } from "@/lib/tools/workout/progression/progression";
  import type { Progress } from "@/lib/tools/workout/types";

  let {
    movementId,
    entry,
    onanswer,
  }: {
    movementId: string;
    entry: Progress;
    onanswer: (accept: boolean) => void;
  } = $props();

  const harder = $derived(entry.suggestion?.kind === "harder");
</script>

<li class="flex flex-col gap-3 border border-line bg-raised p-4">
  <p class="text-sm leading-relaxed text-fg">
    {suggestionText(movementId, entry)}
  </p>
  <div class="flex flex-wrap gap-2">
    <button type="button" class="tool-btn" onclick={() => onanswer(true)}
      >{harder ? "move up" : "move down"}</button
    >
    <button type="button" class="tool-btn" onclick={() => onanswer(false)}
      >{harder ? "not yet" : "keep current"}</button
    >
  </div>
</li>
