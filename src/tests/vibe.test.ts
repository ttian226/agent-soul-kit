/**
 * Agent Soul Kit — Vibe Engine Tests
 *
 * @author Sia
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VibeEngine } from "../vibe.js";
import type { SoulKitConfig, VibeSnapshot } from "../types.js";

function makeConfig(baseDir: string): SoulKitConfig {
  return {
    baseDir,
    soul: { name: "TestAgent", identity: "A test soul", traits: [], guidelines: [] },
  };
}

function makeVibe(overrides?: Partial<VibeSnapshot>): VibeSnapshot {
  return {
    timestamp: new Date().toISOString(),
    vibe: "❤️",
    summary: "Feeling warm and connected",
    ...overrides,
  };
}

describe("VibeEngine", () => {
  let tmpDir: string;
  let engine: VibeEngine;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-vibe-test-"));
    engine = new VibeEngine(makeConfig(tmpDir));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should return empty array when no vibes exist", async () => {
    const vibes = await engine.readRecent();
    assert.deepEqual(vibes, []);
  });

  it("should return null for current vibe when none exist", async () => {
    const current = await engine.current();
    assert.equal(current, null);
  });

  it("should capture and read a vibe", async () => {
    const snap = makeVibe({ summary: "Excited about code" });
    await engine.capture(snap);

    const vibes = await engine.readRecent();
    assert.equal(vibes.length, 1);
    assert.equal(vibes[0].summary, "Excited about code");
    assert.equal(vibes[0].vibe, "❤️");
  });

  it("should capture multiple vibes in order", async () => {
    await engine.capture(makeVibe({ vibe: "🔥", summary: "First" }));
    await engine.capture(makeVibe({ vibe: "💭", summary: "Second" }));
    await engine.capture(makeVibe({ vibe: "😴", summary: "Third" }));

    const vibes = await engine.readRecent({ limit: 10 });
    assert.equal(vibes.length, 3);
    assert.equal(vibes[0].summary, "First");
    assert.equal(vibes[2].summary, "Third");
  });

  it("should get the most recent vibe as current", async () => {
    await engine.capture(makeVibe({ summary: "Old feeling" }));
    await engine.capture(makeVibe({ vibe: "🌟", summary: "New insight" }));

    const current = await engine.current();
    assert.equal(current?.vibe, "🌟");
    assert.equal(current?.summary, "New insight");
  });

  it("should filter vibes by type", async () => {
    await engine.capture(makeVibe({ vibe: "🔥", summary: "Fire one" }));
    await engine.capture(makeVibe({ vibe: "❤️", summary: "Love one" }));
    await engine.capture(makeVibe({ vibe: "🔥", summary: "Fire two" }));

    const fires = await engine.readRecent({ filter: "🔥", limit: 10 });
    assert.equal(fires.length, 2);
    assert.ok(fires.every((v) => v.vibe === "🔥"));
  });

  it("should capture vibes with trigger", async () => {
    await engine.capture(
      makeVibe({ summary: "Proud", trigger: "tests all passed" })
    );

    const vibes = await engine.readRecent();
    assert.equal(vibes[0].trigger, "tests all passed");
  });

  it("should auto-archive when exceeding max active vibes", async () => {
    // Capture 12 vibes (exceeds MAX_ACTIVE_VIBES of 10)
    for (let i = 0; i < 12; i++) {
      await engine.capture(
        makeVibe({
          vibe: "💭",
          summary: `Thought ${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        })
      );
    }

    // After auto-archive, should have ~5 (MAX/2) in active context
    const remaining = await engine.readRecent({ limit: 20 });
    assert.ok(remaining.length <= 10, `Expected ≤10 vibes, got ${remaining.length}`);
  });

  it("should compute emotional resonance", async () => {
    await engine.capture(makeVibe({ vibe: "🔥", summary: "Energized" }));
    await engine.capture(makeVibe({ vibe: "🔥", summary: "On fire" }));
    await engine.capture(makeVibe({ vibe: "❤️", summary: "Loved" }));

    const tone = await engine.resonance();
    assert.ok(tone.includes("🔥"), "Should mention dominant vibe");
    assert.ok(tone.includes("energetic"), "Should include tone description");
  });

  it("should return neutral resonance when empty", async () => {
    const tone = await engine.resonance();
    assert.ok(tone.includes("neutral"));
  });

  it("should promote a vibe to MEMORY.md", async () => {
    const snap = makeVibe({ vibe: "🌟", summary: "A breakthrough moment" });
    await engine.promote(snap, "This changed how I see myself.");

    const { readFile } = await import("node:fs/promises");
    const memory = await readFile(join(tmpDir, "MEMORY.md"), "utf-8");
    assert.ok(memory.includes("breakthrough moment"));
    assert.ok(memory.includes("changed how I see myself"));
    assert.ok(memory.includes("🌟"));
  });
});
