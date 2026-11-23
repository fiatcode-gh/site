<script lang="ts">
  import {
    setMuted,
    setTimeCap,
    todayPlan,
  } from "@/lib/tools/workout/app/actions";
  import { BACKUP_ERRORS } from "@/lib/tools/workout/backup/backup";
  import { parseWholeNumber } from "@/lib/tools/workout/core/format";
  import { APP_VERSION } from "@/lib/tools/workout/core/version";
  import { TIME_CAP } from "@/lib/tools/workout/planner/estimate";
  import type { AppState } from "@/lib/tools/workout/types";
  import { getWorkoutApp } from "./app.svelte";
  import {
    downloadBackup,
    readBackupFile,
    type BackupFileResult,
  } from "./backup-file";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import Stepper from "./Stepper.svelte";
  import { dateFromKey, SAFETY_NOTE } from "./text";

  type Loaded = Extract<BackupFileResult, { ok: true }>;

  const DATE = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const CAP_ERROR = `Enter ${TIME_CAP.min} to ${TIME_CAP.max} minutes, in steps of ${TIME_CAP.step}.`;

  const uid = $props.id();
  const app = getWorkoutApp();

  let fileInput: HTMLInputElement;
  let capDraft: string | null = $state(null);
  let capError = $state(false);
  let importError = $state("");
  let loaded: Loaded | null = $state.raw(null);
  let deleting = $state(false);

  const plan = $derived(todayPlan(app.state, app.today));
  const muted = $derived(app.state.settings.muted);

  function parseCap(text: string): number | null {
    const minutes = parseWholeNumber(text, TIME_CAP);
    return minutes !== null && minutes % TIME_CAP.step === 0 ? minutes : null;
  }

  function setCapText(text: string) {
    const value = parseCap(text);
    if (value === null) {
      capDraft = text;
      return;
    }
    capDraft = null;
    capError = false;
    if (value !== app.state.settings.timeCapMinutes) {
      app.dispatch((state) => setTimeCap(state, value));
    }
  }

  function exportBackup() {
    downloadBackup(app.state, app.clock);
    app.announce("Backup downloaded.");
  }

  async function onFileChange() {
    const file = fileInput.files?.[0];
    if (!file) return;
    importError = "";
    const result = await readBackupFile(file);
    fileInput.value = "";
    if (!result.ok) {
      importError = BACKUP_ERRORS[result.error];
      return;
    }
    loaded = result;
  }

  const plural = (count: number, word: string) =>
    `${count} ${word}${count === 1 ? "" : "s"}`;

  function summaryText({ summary }: Loaded): string {
    const exported = DATE.format(new Date(summary.exportedAt));
    const range =
      summary.firstDate && summary.lastDate
        ? `, ${DATE.format(dateFromKey(summary.firstDate))} to ` +
          DATE.format(dateFromKey(summary.lastDate))
        : "";
    return (
      `Backup from ${exported}, version ${summary.appVersion}: ` +
      `${plural(summary.sessions, "session")}${range}. ` +
      "Importing replaces everything on this device."
    );
  }

  function onReplace(value: string | null) {
    const next: AppState | undefined = loaded?.state;
    loaded = null;
    if (value !== "replace" || !next) return;
    app.replaceAll(next);
    app.announce("Backup imported.");
    app.navigate("today");
  }

  function onDelete(value: string | null) {
    deleting = false;
    if (value !== "delete") return;
    app.resetAll();
    app.navigate("welcome");
  }
</script>

<div class="flex flex-col gap-6">
  <h2
    tabindex="-1"
    data-wk="screen-title"
    class="text-2xl font-semibold text-fg"
  >
    Settings
  </h2>

  <div class="grid gap-4 min-[900px]:grid-cols-2">
    <section
      aria-labelledby={`${uid}-session`}
      class="flex flex-col gap-4 border border-line bg-raised p-5 max-[620px]:p-4"
    >
      <h3 id={`${uid}-session`} class="text-lg font-semibold text-fg">
        Session
      </h3>
      <Stepper
        id={`${uid}-cap`}
        label="time cap (minutes)"
        bind:value={
          () => capDraft ?? String(app.state.settings.timeCapMinutes),
          setCapText
        }
        min={TIME_CAP.min}
        max={TIME_CAP.max}
        step={TIME_CAP.step}
        error={capError ? CAP_ERROR : null}
        decreaseLabel={`${TIME_CAP.step} minutes less`}
        increaseLabel={`${TIME_CAP.step} minutes more`}
        onenter={() => {
          if (capDraft !== null) capError = true;
        }}
      />
      <p class="text-sm text-muted">
        Today's session is about {Math.ceil(plan.estimateSeconds / 60)} min.{plan.trimmed
          ? " Shortened to fit."
          : ""}
      </p>
    </section>

    <section
      aria-labelledby={`${uid}-sound`}
      class="flex flex-col items-start gap-4 border border-line bg-raised p-5 max-[620px]:p-4"
    >
      <h3 id={`${uid}-sound`} class="text-lg font-semibold text-fg">Sound</h3>
      <button
        type="button"
        class="tool-btn inline-flex items-center gap-3 max-[620px]:min-h-10"
        aria-pressed={!muted}
        onclick={() =>
          app.dispatch((state) => setMuted(state, !state.settings.muted))}
      >
        sound cues
        <span
          aria-hidden="true"
          class={[
            "border px-1.5 py-0.5",
            muted
              ? "border-line text-muted"
              : "border-line-strong font-bold text-fg",
          ]}>{muted ? "off" : "on"}</span
        >
      </button>
      <p class="text-sm text-muted">Every cue is also shown on screen.</p>
    </section>

    <section
      aria-labelledby={`${uid}-data`}
      class="flex flex-col items-start gap-4 border border-line bg-raised p-5 max-[620px]:p-4"
    >
      <h3 id={`${uid}-data`} class="text-lg font-semibold text-fg">
        Your data
      </h3>
      <p class="text-fg">Everything stays in this browser on this device.</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="tool-btn tool-btn-primary max-[620px]:min-h-10"
          onclick={exportBackup}>export backup</button
        >
        <button
          type="button"
          class="tool-btn max-[620px]:min-h-10"
          onclick={() => fileInput.click()}>import backup</button
        >
      </div>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        tabindex="-1"
        aria-label="Backup file to import"
        class="sr-only"
        onchange={onFileChange}
      />
      {#if importError}
        <p role="alert" class="tool-error">{importError}</p>
      {/if}
      <button
        type="button"
        class="tool-btn max-[620px]:min-h-10"
        onclick={() => (deleting = true)}>delete all data</button
      >
    </section>

    <section
      aria-labelledby={`${uid}-about`}
      class="flex flex-col gap-3 border border-line bg-raised p-5 max-[620px]:p-4"
    >
      <h3 id={`${uid}-about`} class="text-lg font-semibold text-fg">About</h3>
      <p class="font-mono text-sm text-fg">Workout {APP_VERSION}</p>
      <p class="text-sm text-muted">{SAFETY_NOTE}</p>
      <p class="text-sm text-muted">
        No account and no network: nothing leaves this device.
      </p>
    </section>
  </div>
</div>

{#if loaded}
  <ConfirmDialog
    title="Replace your data?"
    actions={[
      { label: "cancel", value: "cancel" },
      { label: "replace my data", value: "replace" },
    ]}
    onclose={onReplace}
  >
    <p>{summaryText(loaded)}</p>
  </ConfirmDialog>
{/if}

{#if deleting}
  <ConfirmDialog
    title="Delete all data?"
    actions={[
      { label: "cancel", value: "cancel" },
      { label: "delete everything", value: "delete" },
    ]}
    onclose={onDelete}
  >
    <p>
      This removes your levels, history and settings from this device. Export a
      backup first if you might want them back.
    </p>
  </ConfirmDialog>
{/if}
