<script lang="ts">
  let { text, label = "copy" }: { text: string; label?: string } = $props();
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    await navigator.clipboard.writeText(text);
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 1500);
  }
</script>

<button
  type="button"
  onclick={copy}
  disabled={text === ""}
  class="border border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-dim transition-colors hover:border-phosphor/60 hover:text-phosphor disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-dim"
>
  {copied ? "copied ✓" : label}
</button>
