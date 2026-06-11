import { describe, expect, it } from "vitest";
import { explainCron } from "../../src/lib/tools/cron";

describe("explainCron", () => {
  it("describes and computes next runs in UTC", () => {
    const result = explainCron("*/15 * * * *", {
      count: 3,
      tz: "UTC",
      currentDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.description?.toLowerCase()).toContain("15");
      expect(result.nextRuns).not.toBeNull();
      expect(result.nextRuns!.map((d) => d.toISOString())).toEqual([
        "2026-01-01T00:15:00.000Z",
        "2026-01-01T00:30:00.000Z",
        "2026-01-01T00:45:00.000Z",
      ]);
    }
  });

  it("respects the timezone option", () => {
    // 09:00 in Jakarta (UTC+7, no DST) is 02:00 UTC
    const result = explainCron("0 9 * * *", {
      count: 1,
      tz: "Asia/Jakarta",
      currentDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nextRuns).not.toBeNull();
      expect(result.nextRuns![0].toISOString()).toBe(
        "2026-01-01T02:00:00.000Z",
      );
    }
  });

  it("defaults to 5 next runs", () => {
    const result = explainCron("0 * * * *", {
      tz: "UTC",
      currentDate: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.ok && result.nextRuns).toHaveLength(5);
  });

  it("rejects invalid expressions", () => {
    expect(explainCron("61 * * * *", {}).ok).toBe(false);
    expect(explainCron("not a cron", {}).ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(explainCron("   ", {})).toEqual({
      ok: false,
      error: "empty expression",
    });
  });
});

describe("explainCron with diverging parsers", () => {
  it("describes @reboot even though next runs cannot be computed", () => {
    const result = explainCron("@reboot", {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.description?.toLowerCase()).toContain("startup");
      expect(result.nextRuns).toBeNull();
    }
  });
});
