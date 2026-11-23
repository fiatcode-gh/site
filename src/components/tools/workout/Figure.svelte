<script lang="ts">
  import { figureSvg } from "@/lib/tools/workout/library/figure";
  import { poseFor } from "@/lib/tools/workout/library/poses";

  let { variationId, size }: { variationId: string; size: "large" | "thumb" } =
    $props();

  const pose = $derived(poseFor(variationId));
</script>

{#if pose}
  <span
    aria-hidden="true"
    data-wk="figure"
    class={[
      "block text-fg [&>svg]:block [&>svg]:h-auto [&>svg]:w-full",
      size === "large" ? "w-full max-w-[260px] min-w-[200px]" : "w-24 shrink-0",
    ]}>{@html figureSvg(pose)}</span
  >
{/if}
