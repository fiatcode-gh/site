<script lang="ts">
  import { onMount } from "svelte";
  import {
    parseDates,
    buildCycles,
    computeStats,
    predictNext,
    estimateFertility,
    sdmBand,
    anomalies,
    eligibility,
    addDays,
    tagDay,
    type CalendarContext,
  } from "@/lib/tools/cycle";

  const KEY = "fiatcode.cycle.dates";
  let mounted = $state(false);
  let text = $state("");
  let tab = $state<"summary" | "calendar" | "safe dates" | "cycles">("summary");

  onMount(() => {
    text = localStorage.getItem(KEY) ?? "";
    mounted = true;
  });

  function save() {
    localStorage.setItem(KEY, text);
  }
  function clear() {
    localStorage.removeItem(KEY);
    text = "";
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const fmtS = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtW = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });

  const parsed = $derived(
    mounted ? parseDates(text) : { dates: [], issues: [] },
  );
  const cycles = $derived(buildCycles(parsed.dates));
  const stats = $derived(computeStats(cycles));
  const hasData = $derived(parsed.dates.length >= 2);
  const last = $derived(
    parsed.dates.length ? parsed.dates[parsed.dates.length - 1] : null,
  );
  const prediction = $derived(last ? predictNext(last, stats) : null);
  const fertility = $derived(last ? estimateFertility(last, stats) : null);
  const sdm = $derived(last ? sdmBand(last, stats) : null);
  const flagged = $derived(anomalies(cycles));
  const elig = $derived(eligibility(stats));
  const periodEnd = $derived(last ? addDays(last, 5) : null);
  const calCtx = $derived<CalendarContext | null>(
    last && periodEnd && fertility && prediction
      ? {
          periodStart: last,
          periodEnd,
          fertileStart: fertility.fertileStart,
          fertileEnd: fertility.fertileEnd,
          ovulationEstimate: fertility.ovulationEstimate,
          ovulationBandDays: fertility.ovulationBandDays,
          nextStart: prediction.point,
        }
      : null,
  );

  // Safe zone 1: day after period ends → day before fertile window
  const safe1Start = $derived(periodEnd ? addDays(periodEnd, 1) : null);
  const safe1End = $derived(
    fertility ? addDays(fertility.fertileStart, -1) : null,
  );
  // Safe zone 2: day after fertile window ends → day before predicted next
  const safe2Start = $derived(
    fertility ? addDays(fertility.fertileEnd, 1) : null,
  );
  const safe2End = $derived(prediction ? addDays(prediction.point, -1) : null);

  const safe1Days = $derived(
    safe1Start && safe1End
      ? Math.round((safe1End.getTime() - safe1Start.getTime()) / 86400000 + 1)
      : 0,
  );
  const safe2Days = $derived(
    safe2Start && safe2End
      ? Math.round((safe2End.getTime() - safe2Start.getTime()) / 86400000 + 1)
      : 0,
  );

  const tagClass: Record<string, string> = {
    period: "bg-phosphor text-bg font-bold",
    ovulation: "bg-phosphor/90 text-bg font-bold ring-1 ring-phosphor",
    fertile: "border border-phosphor/40 bg-surface-2 text-ink",
    safe: "text-ink-dim",
    neutral: "text-ink-faint",
  };

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const WDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function calMonths(): { year: number; month: number }[] {
    if (!last) return [];
    const y = last.getFullYear();
    const m = last.getMonth();
    // Show the month of the last period and the next one
    const second =
      m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 };
    return [{ year: y, month: m }, second];
  }

  function calCells(year: number, month: number): (number | null)[] {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(first).fill(null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ];
  }

  function getDayTag(year: number, month: number, day: number): string {
    if (!calCtx) return "neutral";
    const d = new Date(year, month, day);
    return tagDay(d, calCtx);
  }

  // Distribution bar: max count for scaling
  const maxCount = $derived(
    stats.distribution ? Math.max(1, ...Object.values(stats.distribution)) : 1,
  );
</script>

<div class="flex flex-col gap-5">
  <!-- Input area -->
  <div class="flex flex-col gap-2">
    <label for="cycle-dates" class="font-mono text-xs text-ink-faint">
      period start dates — one ISO date (YYYY-MM-DD) per line
    </label>
    <textarea
      id="cycle-dates"
      bind:value={text}
      rows="6"
      spellcheck="false"
      class="w-full border border-line bg-bg/40 p-3 font-mono text-sm text-ink placeholder:text-ink-faint"
    ></textarea>
    <div class="flex gap-2">
      <button
        onclick={save}
        class="border border-line bg-surface-2/40 px-3 py-1.5 font-mono text-xs text-ink hover:border-phosphor/60"
      >
        save to this browser
      </button>
      <button
        onclick={clear}
        class="border border-line bg-surface-2/40 px-3 py-1.5 font-mono text-xs text-ink-dim hover:border-phosphor/60"
      >
        clear
      </button>
    </div>
  </div>

  <!-- Parse issues -->
  {#if mounted && parsed.issues.length}
    <p class="font-mono text-xs text-phosphor-deep">
      # skipped {parsed.issues.length} unreadable line(s): {parsed.issues
        .map((i) => `L${i.line}`)
        .join(", ")}
    </p>
  {/if}

  <!-- Low confidence notice -->
  {#if mounted && hasData && fertility?.confidence === "low"}
    <p class="font-mono text-xs text-ink-faint">
      # fewer than 6 cycles — estimates are low-confidence
    </p>
  {/if}

  <!-- Empty state -->
  {#if mounted && !hasData}
    <p class="font-mono text-xs text-ink-faint">
      # paste at least two period start dates to compute cycles
    </p>
  {/if}

  <!-- Main content: tabs + panels -->
  {#if mounted && hasData}
    <!-- Header stats line -->
    <p class="font-mono text-xs text-ink-faint">
      # {parsed.dates.length} period{parsed.dates.length !== 1 ? "s" : ""} ·
      {stats.cycleCount} cycle{stats.cycleCount !== 1 ? "s" : ""} ·
      {flagged.length} anomal{flagged.length !== 1 ? "ies" : "y"}
      {#if elig.sdmEligible}
        · SDM-eligible
      {/if}
    </p>

    <!-- Tab bar -->
    <div class="flex border border-line bg-surface/40 font-mono text-xs">
      {#each ["summary", "calendar", "safe dates", "cycles"] as const as t}
        <button
          onclick={() => (tab = t)}
          class="flex-1 px-2 py-2 capitalize transition-colors {tab === t
            ? 'bg-surface-2 text-phosphor'
            : 'text-ink-faint hover:text-ink'}"
        >
          {t}
        </button>
      {/each}
    </div>

    <!-- SUMMARY TAB -->
    {#if tab === "summary"}
      <div class="flex flex-col gap-3">
        <!-- Stat cards -->
        <div class="grid grid-cols-3 gap-2">
          <div class="border border-line bg-surface p-3 text-center">
            <p class="font-mono text-base font-bold text-phosphor">
              {Math.round(stats.mean)}d
            </p>
            <p
              class="mt-0.5 font-mono text-[10px] leading-tight text-ink-faint"
            >
              mean cycle
            </p>
          </div>
          <div class="border border-line bg-surface p-3 text-center">
            <p class="font-mono text-base font-bold text-ink">
              {stats.shortest}–{stats.longest}d
            </p>
            <p
              class="mt-0.5 font-mono text-[10px] leading-tight text-ink-faint"
            >
              range
            </p>
          </div>
          <div class="border border-line bg-surface p-3 text-center">
            <p
              class="font-mono text-base font-bold {flagged.length === 0
                ? 'text-ink'
                : 'text-phosphor-deep'}"
            >
              {stats.cycleCount - flagged.length}/{stats.cycleCount}
            </p>
            <p
              class="mt-0.5 font-mono text-[10px] leading-tight text-ink-faint"
            >
              clean cycles
            </p>
          </div>
        </div>

        <!-- Next period prediction -->
        {#if prediction}
          <div class="border border-phosphor/30 bg-surface p-4">
            <p class="font-mono text-xs uppercase tracking-wide text-phosphor">
              next period expected
            </p>
            <p class="font-serif mt-1 text-2xl text-ink">
              {fmt(prediction.point)}
            </p>
            <p class="mt-0.5 font-mono text-xs text-ink-faint">
              earliest {fmtS(prediction.earliest)} · latest {fmtS(
                prediction.latest,
              )}
            </p>
          </div>
        {/if}

        <!-- Timeline rows -->
        <div class="flex flex-col gap-1.5">
          {#if periodEnd}
            <div
              class="flex items-center justify-between border border-line bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 bg-phosphor/60"></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  period ends ~
                </span>
              </div>
              <span class="font-mono text-xs text-ink flex-shrink-0 text-right">
                {fmtW(periodEnd)}
              </span>
            </div>
          {/if}

          {#if safe1Start && safe1End && safe1Days > 0}
            <div
              class="flex items-center justify-between border border-line bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 border border-line"></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  safe zone 1 (post-period)
                </span>
              </div>
              <span class="font-mono text-xs text-ink flex-shrink-0 text-right">
                {fmtS(safe1Start)} – {fmtS(safe1End)} ({safe1Days}d)
              </span>
            </div>
          {/if}

          {#if fertility}
            <div
              class="flex items-center justify-between border border-phosphor/20 bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 border border-phosphor/40"
                ></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  fertile window opens (estimated · probabilistic)
                </span>
              </div>
              <span class="font-mono text-xs text-ink flex-shrink-0 text-right">
                {fmtW(fertility.fertileStart)}
              </span>
            </div>

            <div
              class="flex items-center justify-between border border-phosphor/20 bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 bg-phosphor/80"></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  ovulation estimate
                </span>
              </div>
              <span class="font-mono text-xs text-right flex-shrink-0">
                <span class="text-phosphor">
                  ~{fmtS(fertility.ovulationEstimate)} ±{fertility.ovulationBandDays}
                  days
                </span>
                <br />
                <span class="text-ink-faint text-[10px]">
                  cannot be pinned by calendar alone
                </span>
              </span>
            </div>

            <div
              class="flex items-center justify-between border border-phosphor/20 bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 border border-phosphor/40"
                ></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  fertile window closes (estimated · probabilistic)
                </span>
              </div>
              <span class="font-mono text-xs text-ink flex-shrink-0 text-right">
                {fmtW(fertility.fertileEnd)}
              </span>
            </div>
          {/if}

          {#if safe2Start && safe2End && safe2Days > 0}
            <div
              class="flex items-center justify-between border border-line bg-surface px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="h-2 w-2 flex-shrink-0 border border-line"></span>
                <span class="font-mono text-sm text-ink-dim truncate">
                  safe zone 2 (post-ovulation)
                </span>
              </div>
              <span class="font-mono text-xs text-ink flex-shrink-0 text-right">
                {fmtS(safe2Start)} – {fmtS(safe2End)} ({safe2Days}d)
              </span>
            </div>
          {/if}

          <!-- SDM cross-check -->
          {#if sdm}
            <div
              class="flex items-center justify-between border border-line-soft bg-surface-2/40 px-4 py-3 gap-2"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="font-mono text-xs text-ink-faint truncate">
                  Standard Days Method (days 8–19):
                </span>
              </div>
              <span
                class="font-mono text-xs text-ink-dim flex-shrink-0 text-right"
              >
                {fmtS(sdm.start)} – {fmtS(sdm.end)}
              </span>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- CALENDAR TAB -->
    {#if tab === "calendar"}
      <div class="flex flex-col gap-4">
        {#each calMonths() as { year, month }}
          {@const cells = calCells(year, month)}
          <div class="border border-line bg-surface p-4">
            <p
              class="mb-3 text-center font-mono text-sm uppercase tracking-wider text-ink-faint"
            >
              {MONTHS[month]}
              {year}
            </p>
            <div
              class="mb-2 grid grid-cols-7 gap-1 text-center font-mono text-xs text-ink-faint"
            >
              {#each WDAYS as d}
                <span>{d}</span>
              {/each}
            </div>
            <div class="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {#each cells as d, i}
                <div class="flex h-7 w-7 items-center justify-center mx-auto">
                  {#if d !== null}
                    {@const dtag = getDayTag(year, month, d)}
                    <span
                      class="flex h-7 w-7 items-center justify-center text-xs {tagClass[
                        dtag
                      ]}"
                    >
                      {d}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}

        <!-- Legend -->
        <div class="border border-line bg-surface p-4 grid grid-cols-2 gap-2.5">
          {#each [{ cls: "bg-phosphor", label: "period (current)" }, { cls: "border border-phosphor/40 bg-surface-2", label: "fertile (estimated · probabilistic)" }, { cls: "bg-phosphor/90 ring-1 ring-phosphor", label: "ovulation estimate" }, { cls: "text-ink-dim border border-line", label: "safe days" }] as leg}
            <div class="flex items-center gap-2">
              <span class="h-3 w-3 flex-shrink-0 {leg.cls}"></span>
              <span class="font-mono text-xs text-ink-faint">{leg.label}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- SAFE DATES TAB -->
    {#if tab === "safe dates"}
      <div class="flex flex-col gap-3">
        {#if safe1Start && safe1End && safe1Days > 0}
          <div class="border border-line bg-surface p-4 space-y-2">
            <p class="font-mono text-xs uppercase tracking-wide text-ink-faint">
              safe zone 1 — post-period
            </p>
            <p class="font-serif text-2xl text-ink">
              {fmtS(safe1Start)} – {fmtS(safe1End)}
            </p>
            <p class="font-mono text-xs text-ink-faint">
              {safe1Days}-day window · after bleeding ends, before fertility
              begins
            </p>
          </div>
        {:else if safe1Days <= 0}
          <p class="font-mono text-xs text-ink-faint">
            # no safe zone 1 — fertile window overlaps with period end
          </p>
        {/if}

        {#if fertility}
          <div class="border border-phosphor/30 bg-surface p-4 space-y-2">
            <p class="font-mono text-xs uppercase tracking-wide text-phosphor">
              avoid — fertile window (estimated · probabilistic)
            </p>
            <p class="font-serif text-2xl text-ink">
              {fmtS(fertility.fertileStart)} – {fmtS(fertility.fertileEnd)}
            </p>
            <p class="font-mono text-xs text-ink-dim">
              ovulation estimate: ~{fmtS(fertility.ovulationEstimate)} ±{fertility.ovulationBandDays}
              days
            </p>
            <p class="font-mono text-xs text-ink-faint">
              cannot be pinned by calendar alone — highest pregnancy risk
            </p>
          </div>
        {/if}

        {#if safe2Start && safe2End && safe2Days > 0}
          <div class="border border-line bg-surface p-4 space-y-2">
            <p class="font-mono text-xs uppercase tracking-wide text-ink-faint">
              safe zone 2 — post-ovulation
            </p>
            <p class="font-serif text-2xl text-ink">
              {fmtS(safe2Start)} – {fmtS(safe2End)}
            </p>
            <p class="font-mono text-xs text-ink-faint">
              {safe2Days}-day window · after ovulation has passed, before next
              period
            </p>
          </div>
        {:else if safe2Days <= 0}
          <p class="font-mono text-xs text-ink-faint">
            # no safe zone 2 — next period predicted immediately after fertile
            window
          </p>
        {/if}

        <!-- SDM cross-check -->
        {#if sdm}
          <div class="border border-line-soft bg-surface-2/40 p-4 space-y-1">
            <p class="font-mono text-xs text-ink-faint">
              Standard Days Method cross-check (days 8–19 of cycle):
            </p>
            <p class="font-mono text-sm text-ink">
              {fmtS(sdm.start)} – {fmtS(sdm.end)}
            </p>
            <p class="font-mono text-xs text-ink-faint">
              {elig.note}
            </p>
          </div>
        {/if}

        <!-- Reliability note -->
        <div class="border border-line-soft bg-surface-2/40 p-4 space-y-1.5">
          <p class="font-mono text-xs text-ink-dim">dataset reliability</p>
          <p class="font-mono text-xs text-ink-faint">
            {stats.cycleCount} cycle{stats.cycleCount !== 1 ? "s" : ""} logged · {flagged.length}
            anomal{flagged.length !== 1 ? "ies" : "y"}
            · range {stats.shortest}–{stats.longest}d
          </p>
          {#if flagged.length > 0}
            <p class="font-mono text-xs text-phosphor-deep">
              # {flagged.length} anomal{flagged.length !== 1 ? "ies" : "y"} detected
              — estimates less reliable
            </p>
          {:else}
            <p class="font-mono text-xs text-ink-faint">
              # no anomalies — dataset consistent
            </p>
          {/if}
        </div>

        <!-- Disclaimer -->
        <p class="font-mono text-[10px] text-ink-faint leading-relaxed">
          Calendar/Standard Days methods are ~95% (perfect use) / ~88% (typical
          use) effective for 26–32-day cycles. Not a contraceptive guarantee;
          ovulation cannot be pinned by calendar alone.
        </p>
      </div>
    {/if}

    <!-- CYCLES TAB -->
    {#if tab === "cycles"}
      <div class="flex flex-col gap-3">
        <!-- Distribution bar chart -->
        <div class="border border-line bg-surface p-4 space-y-3">
          <p class="font-mono text-xs uppercase tracking-wide text-ink-faint">
            length distribution ({stats.cycleCount} cycles)
          </p>
          {#each Object.entries(stats.distribution).sort(([a], [b]) => +a - +b) as [len, count]}
            {@const pct = Math.round((+count / stats.cycleCount) * 100)}
            {@const barW = Math.round((+count / maxCount) * 100)}
            <div class="flex items-center gap-3">
              <span class="w-8 font-mono text-sm text-phosphor">{len}d</span>
              <div class="flex-1 bg-surface-2 h-5 overflow-hidden">
                <div
                  class="h-full bg-phosphor/40 flex items-center justify-end pr-2"
                  style="width:{barW}%"
                >
                  <span class="font-mono text-[10px] text-ink">{count}×</span>
                </div>
              </div>
              <span class="w-10 font-mono text-xs text-ink-faint text-right">
                {pct}%
              </span>
            </div>
          {/each}
        </div>

        <!-- All cycles list -->
        <div class="flex flex-col gap-1.5">
          <p class="font-mono text-xs text-ink-faint px-1">
            all {cycles.length} cycles
          </p>
          {#each cycles as c, i}
            {@const isAnomaly = c.days < 21 || c.days > 35}
            <div
              class="border {isAnomaly
                ? 'border-phosphor/40'
                : 'border-line'} bg-surface px-4 py-2.5 flex items-center justify-between"
            >
              <span class="font-mono text-[11px] text-ink-faint">
                {fmtS(c.from)} → {fmtS(c.to)}
              </span>
              <div class="flex items-center gap-2">
                <div
                  class="h-1.5 bg-phosphor/50"
                  style="width:{Math.round(
                    (c.days / (stats.longest || 30)) * 48,
                  )}px"
                ></div>
                <span
                  class="font-mono text-sm font-bold {isAnomaly
                    ? 'text-phosphor-deep'
                    : 'text-phosphor'}"
                >
                  {c.days}d
                </span>
                {#if isAnomaly}
                  <span class="font-mono text-[10px] text-phosphor-deep">!</span
                  >
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Summary footer -->
        <div
          class="border border-line bg-surface px-4 py-3 flex justify-between font-mono text-xs text-ink-faint"
        >
          <span>
            {stats.cycleCount - flagged.length}/{stats.cycleCount} clean
          </span>
          <span>
            anomalies:
            <span
              class={flagged.length === 0 ? "text-ink" : "text-phosphor-deep"}
            >
              {flagged.length}
            </span>
          </span>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Footer disclaimer (always visible when there's data) -->
  {#if mounted && hasData}
    <p class="font-mono text-center text-[10px] text-ink-faint pb-4">
      Ogino-Knaus calendar method · not a medical tool · data stays in this
      browser
    </p>
  {/if}
</div>
