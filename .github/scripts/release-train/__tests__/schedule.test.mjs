/**
 * Unit tests — schedule cron alignment (Kuwait AST = UTC+3).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEDULE_CRONS_UTC,
  KUWAIT_UTC_OFFSET_HOURS,
  kuwaitHourFromUtc,
  formatKuwaitReleaseTag,
  reportFilename,
} from "../constants.mjs";

describe("release-train schedule", () => {
  it("exports two UTC crons for 06:00 and 18:00 Kuwait", () => {
    assert.deepEqual(SCHEDULE_CRONS_UTC, ["0 3 * * *", "0 15 * * *"]);
    assert.equal(KUWAIT_UTC_OFFSET_HOURS, 3);
  });

  it("maps UTC 03:00 → Kuwait 06:00 and UTC 15:00 → Kuwait 18:00", () => {
    const morning = new Date(Date.UTC(2026, 6, 31, 3, 0, 0));
    const evening = new Date(Date.UTC(2026, 6, 31, 15, 0, 0));
    assert.equal(kuwaitHourFromUtc(morning), 6);
    assert.equal(kuwaitHourFromUtc(evening), 18);
  });

  it("formats release tag and report filename in Kuwait wall time", () => {
    const utc = new Date(Date.UTC(2026, 6, 31, 3, 5, 0)); // 06:05 Kuwait
    assert.equal(formatKuwaitReleaseTag(utc), "release(train): 2026-07-31 06:00 Kuwait");
    assert.equal(reportFilename(utc), "2026-07-31-06.md");
  });
});
