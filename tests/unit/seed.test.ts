import { describe, expect, it } from "vitest";
import {
  buildSpawnSchedule,
  createRng,
  dailySeed,
  hashStringToSeed,
  utcDateString,
} from "../../src/game/daily/seed";

describe("daily seed (T5)", () => {
  it("formats UTC date keys stably", () => {
    expect(utcDateString(new Date("2026-09-05T01:00:00Z"))).toBe("2026-09-05");
    expect(utcDateString(new Date("2026-09-05T23:59:59Z"))).toBe("2026-09-05");
    expect(utcDateString(new Date("2026-09-05T00:00:00Z"))).toBe("2026-09-05");
  });

  it("maps the same UTC date to the same seed", () => {
    const a = dailySeed(new Date("2026-03-05T08:00:00Z"));
    const b = dailySeed(new Date("2026-03-05T20:00:00Z"));
    expect(a.dateKey).toBe("2026-03-05");
    expect(a.seed).toBe(b.seed);
  });

  it("changes seed across UTC dates", () => {
    const a = dailySeed(new Date("2026-03-05T12:00:00Z"));
    const b = dailySeed(new Date("2026-03-06T12:00:00Z"));
    expect(a.seed).not.toBe(b.seed);
  });

  it("hash is deterministic", () => {
    expect(hashStringToSeed("daily-hold:2026-03-05")).toBe(
      hashStringToSeed("daily-hold:2026-03-05"),
    );
  });

  it("PRNG sequence is identical for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 20 }, () => a())).toEqual(
      Array.from({ length: 20 }, () => b()),
    );
  });

  it("spawn schedule is identical for the same seed", () => {
    const seed = dailySeed(new Date("2026-03-05T12:00:00Z")).seed;
    expect(buildSpawnSchedule(seed)).toEqual(buildSpawnSchedule(seed));
  });

  it("spawn schedule differs for different seeds", () => {
    const s1 = dailySeed(new Date("2026-03-05T12:00:00Z")).seed;
    const s2 = dailySeed(new Date("2026-03-06T12:00:00Z")).seed;
    expect(buildSpawnSchedule(s1)).not.toEqual(buildSpawnSchedule(s2));
  });
});
