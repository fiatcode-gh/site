<script lang="ts">
  import { onMount, type Snippet } from "svelte";

  interface Action {
    label: string;
    value: string;
    primary?: boolean;
  }

  let {
    title,
    actions,
    initialFocus = "first",
    onclose,
    children,
  }: {
    title: string;
    actions: Action[];
    initialFocus?: "first" | "last";
    onclose: (value: string | null) => void;
    children: Snippet;
  } = $props();

  const titleId = $props.id();
  let dialog: HTMLDialogElement;
  let buttons: HTMLButtonElement[] = $state([]);
  let finished = false;

  function finish(value: string | null) {
    if (finished) return;
    finished = true;
    if (dialog.open) dialog.close();
    onclose(value);
  }

  onMount(() => {
    dialog.showModal();
    (initialFocus === "last" ? buttons.at(-1) : buttons[0])?.focus();
    return () => {
      finished = true;
      if (dialog.open) dialog.close();
    };
  });
</script>

<dialog
  bind:this={dialog}
  aria-labelledby={titleId}
  oncancel={(event) => {
    event.preventDefault();
    finish(null);
  }}
  class="m-auto w-[min(28rem,calc(100vw-32px))] border border-line-strong bg-surface p-6 text-fg backdrop:bg-fg/40 max-[620px]:p-[18px]"
>
  <h2 id={titleId} class="text-lg font-semibold">{title}</h2>
  <div class="mt-3 text-sm leading-relaxed text-muted">
    {@render children()}
  </div>
  <div class="mt-5 flex flex-wrap gap-2">
    {#each actions as action, i (action.value)}
      <button
        bind:this={buttons[i]}
        type="button"
        class={action.primary ? "tool-btn tool-btn-primary" : "tool-btn"}
        onclick={() => finish(action.value)}>{action.label}</button
      >
    {/each}
  </div>
</dialog>
