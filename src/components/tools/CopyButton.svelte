<script lang="ts">
  import { onDestroy } from "svelte";

  let { text, label = "copy" }: { text: string; label?: string } = $props();
  let status: "idle" | "copied" | "failed" = $state("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      status = "copied";
    } catch {
      // insecure context or permission denied — tell the user instead of silently failing
      status = "failed";
    }
    clearTimeout(timer);
    timer = setTimeout(() => (status = "idle"), 1500);
  }

  onDestroy(() => clearTimeout(timer));
</script>

<button type="button" onclick={copy} disabled={text === ""} class="tool-btn">
  {status === "copied"
    ? "copied ✓"
    : status === "failed"
      ? "copy failed"
      : label}
</button>
