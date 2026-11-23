<script lang="ts">
  let {
    id,
    label,
    value = $bindable(),
    min,
    max,
    step = 1,
    error = null,
    decreaseLabel,
    increaseLabel,
    onenter,
    onpress,
  }: {
    id: string;
    label: string;
    value: string;
    min: number;
    max: number;
    step?: number;
    error?: string | null;
    decreaseLabel: string;
    increaseLabel: string;
    onenter?: () => void;
    onpress?: () => void;
  } = $props();

  const errorId = $derived(`${id}-error`);

  function nudge(direction: number) {
    onpress?.();
    const current = Number.parseInt(value, 10);
    const start = Number.isInteger(current)
      ? min + Math.round((current - min) / step) * step
      : min;
    value = String(Math.min(max, Math.max(min, start + direction * step)));
  }
</script>

<div class="flex flex-col gap-2">
  <label for={id} class="font-mono text-xs text-muted">{label}</label>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="tool-btn size-12 shrink-0 p-0 text-lg"
      aria-label={decreaseLabel}
      onclick={() => nudge(-1)}>−</button
    >
    <input
      {id}
      type="text"
      inputmode="numeric"
      autocomplete="off"
      bind:value
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? errorId : undefined}
      onkeydown={(event) => {
        if (event.key === "Enter") onenter?.();
      }}
      class="h-12 w-24 min-w-0 border border-field bg-raised px-2 text-center font-mono text-xl font-semibold text-fg tabular-nums"
    />
    <button
      type="button"
      class="tool-btn size-12 shrink-0 p-0 text-lg"
      aria-label={increaseLabel}
      onclick={() => nudge(1)}>+</button
    >
  </div>
  {#if error}
    <p id={errorId} role="alert" class="tool-error">{error}</p>
  {/if}
</div>
