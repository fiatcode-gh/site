<script lang="ts">
  import { variation } from "@/lib/tools/workout/library/library";
  import {
    PATTERN_LABELS,
    type Pattern,
  } from "@/lib/tools/workout/library/patterns";
  import type { Snippet } from "svelte";
  import Figure from "./Figure.svelte";
  import { workText, type WorkShape } from "./text";

  let {
    exercise,
    children,
  }: {
    exercise: WorkShape & {
      pattern: Pattern;
      variationId: string;
      variationName?: string;
    };
    children?: Snippet;
  } = $props();

  const name = $derived(
    exercise.variationName ?? variation(exercise.variationId)?.name ?? "",
  );
</script>

<li class="flex items-start gap-4 border border-line bg-raised p-3">
  <Figure variationId={exercise.variationId} size="thumb" />
  <div class="flex min-w-0 flex-col gap-1">
    <p class="font-mono text-xs text-faint">
      {PATTERN_LABELS[exercise.pattern]}
    </p>
    <p class="font-semibold text-fg">{name}</p>
    <p class="font-mono text-sm text-muted">{workText(exercise)}</p>
    {@render children?.()}
  </div>
</li>
