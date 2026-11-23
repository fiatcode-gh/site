<script lang="ts">
  import type { PersistenceProblem } from "@/lib/tools/workout/app/app-store";
  import type { ScreenName } from "@/lib/tools/workout/route";
  import { onMount } from "svelte";
  import {
    createWorkoutApp,
    setWorkoutApp,
    showFocusTarget,
    showStage,
    type WorkoutApp,
  } from "./workout/app.svelte";
  import ConfirmDialog from "./workout/ConfirmDialog.svelte";
  import MovementScreen from "./workout/MovementScreen.svelte";
  import PlacementScreen from "./workout/PlacementScreen.svelte";
  import PlayerScreen from "./workout/PlayerScreen.svelte";
  import ProgressScreen from "./workout/ProgressScreen.svelte";
  import SettingsScreen from "./workout/SettingsScreen.svelte";
  import SummaryScreen from "./workout/SummaryScreen.svelte";
  import TodayScreen from "./workout/TodayScreen.svelte";
  import WelcomeScreen from "./workout/WelcomeScreen.svelte";

  const SCREENS: ScreenName[] = [
    "welcome",
    "placement",
    "today",
    "session",
    "progress",
    "progress-movement",
    "settings",
  ];

  const SECTIONS = [
    { name: "today", href: "#/today" },
    { name: "progress", href: "#/progress" },
    { name: "settings", href: "#/settings" },
  ] as const;

  const NO_STRIP: readonly string[] = ["welcome", "placement", "session"];

  const BANNERS: Readonly<
    Record<PersistenceProblem, { text: string; canDelete: boolean }>
  > = {
    unavailable: {
      text: "This browser is not letting Workout save. You can train now, but this visit will not be remembered.",
      canDelete: false,
    },
    failed: {
      text: "Saving failed just now. Your latest changes are only in this tab. Export a backup from Settings when you can.",
      canDelete: false,
    },
    corrupt: {
      text: "The data saved on this device could not be read, so it was left untouched. This visit will not be saved.",
      canDelete: true,
    },
    unsupported: {
      text: "The data saved on this device comes from a newer version of Workout and was left untouched. This visit will not be saved.",
      canDelete: true,
    },
  };

  let app: WorkoutApp | null = $state.raw(null);
  let root: HTMLElement;
  let confirming = $state(false);
  let shownScreen: string | null = null;

  setWorkoutApp(() => app!);

  onMount(() => {
    const created = createWorkoutApp(SCREENS);
    app = created;
    return () => created.destroy();
  });

  const view = $derived.by(() => {
    const name = app?.route.name;
    if (name !== "session") return name;
    return app?.state.activeSession?.phase === "summary" ? "summary" : name;
  });

  $effect(() => {
    const name = view;
    if (!name || name === shownScreen) return;
    const first = shownScreen === null;
    shownScreen = name;
    if (first) return;
    const stage = root.querySelector<HTMLElement>('[data-wk="stage"]');
    if (stage) {
      showStage(stage);
      return;
    }
    showFocusTarget(
      root.querySelector<HTMLElement>('[data-wk="primary"]') ??
        root.querySelector<HTMLElement>('[data-wk="screen-title"]'),
    );
  });

  function onConfirm(value: string | null) {
    confirming = false;
    if (value !== "delete" || !app) return;
    app.resetAll();
  }
</script>

<div bind:this={root} data-wk="root">
  {#if app}
    {@const banner = app.problem ? BANNERS[app.problem] : null}
    {#if banner}
      <div class="band px-6 py-4 max-[620px]:px-[18px]">
        <div role="status" class="tool-error flex flex-col items-start gap-3">
          <p>{banner.text}</p>
          {#if banner.canDelete}
            <button
              type="button"
              class="tool-btn"
              onclick={() => (confirming = true)}>delete saved data</button
            >
          {/if}
        </div>
      </div>
    {/if}
    {#if confirming}
      <ConfirmDialog
        title="Delete saved data?"
        actions={[
          { label: "cancel", value: "cancel" },
          { label: "delete saved data", value: "delete" },
        ]}
        onclose={onConfirm}
      >
        <p>
          This removes everything Workout saved on this device, including your
          history. It cannot be undone.
        </p>
      </ConfirmDialog>
    {/if}
    {#if !NO_STRIP.includes(app.route.name)}
      {@const section =
        app.route.name === "progress-movement" ? "progress" : app.route.name}
      <nav aria-label="Workout sections" class="ruled-flex band">
        {#each SECTIONS as link (link.name)}
          <a
            href={link.href}
            class="mode flex items-center no-underline"
            aria-current={section === link.name ? "page" : undefined}
            data-active={section === link.name ? "" : undefined}>{link.name}</a
          >
        {/each}
      </nav>
    {/if}
    <div class="p-6 max-[620px]:p-[18px]">
      {#if app.route.name === "welcome"}
        <WelcomeScreen />
      {:else if app.route.name === "placement"}
        <PlacementScreen />
      {:else if app.route.name === "session" && app.state.activeSession}
        {#if app.state.activeSession.phase === "summary"}
          <SummaryScreen />
        {:else}
          <PlayerScreen />
        {/if}
      {:else if app.route.name === "progress"}
        <ProgressScreen />
      {:else if app.route.name === "progress-movement"}
        {#key app.route.param}
          <MovementScreen />
        {/key}
      {:else if app.route.name === "settings"}
        <SettingsScreen />
      {:else}
        <TodayScreen />
      {/if}
    </div>
  {:else}
    <div class="p-6 max-[620px]:p-[18px]">
      <p class="font-mono text-xs text-faint">Loading…</p>
    </div>
  {/if}
  <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
    {app?.announcement ?? ""}
  </div>
</div>
