<script lang="ts">
  import { getWorkoutApp } from "./app.svelte";
  import { SAFETY_NOTE } from "./text";

  const uid = $props.id();
  const app = getWorkoutApp();

  const STEPS = [
    "Open the app and follow today's session, one set at a time.",
    "After each set, confirm the reps you did. The target is already filled in, so a set done as planned is one tap.",
    "The app uses what you log to plan the next session, with small steps up or down for each movement.",
  ];
</script>

<div class="flex max-w-[68ch] flex-col gap-6">
  <div class="flex flex-col gap-3">
    <h2
      tabindex="-1"
      data-wk="screen-title"
      class="text-2xl font-semibold text-fg"
    >
      Welcome
    </h2>
    <p class="text-lg leading-relaxed text-fg">
      A full-body bodyweight session, planned for you every day. No equipment,
      no account.
    </p>
  </div>

  <section
    aria-labelledby={`${uid}-how`}
    class="flex flex-col gap-3 border border-line bg-raised p-5 max-[620px]:p-4"
  >
    <h3 id={`${uid}-how`} class="text-lg font-semibold text-fg">
      How it works
    </h3>
    <ol class="flex flex-col gap-3">
      {#each STEPS as step, i (step)}
        <li class="grid grid-cols-[2ch_minmax(0,1fr)] gap-3 leading-relaxed">
          <span aria-hidden="true" class="font-mono text-sm text-kw"
            >{String(i + 1).padStart(2, "0")}</span
          >
          <span class="text-fg">{step}</span>
        </li>
      {/each}
    </ol>
  </section>

  <p class="text-sm leading-relaxed text-muted">{SAFETY_NOTE}</p>

  <div>
    <button
      type="button"
      class="tool-btn tool-btn-primary"
      onclick={() => app.navigate("placement")}>set my starting level</button
    >
  </div>
</div>
