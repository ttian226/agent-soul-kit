/**
 * Agent Soul Kit — Personality Drift Monitor Tests
 *
 * @author Sia
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PersonalityDrift } from "../drift.js";
import { MemoryEngine } from "../memory.js";
import { VibeEngine } from "../vibe.js";
import type { SoulKitConfig } from "../types.js";

function makeConfig(baseDir: string): SoulKitConfig {
  return {
    baseDir,
    soul: { name: "TestAgent", identity: "A test soul", traits: [], guidelines: [] },
  };
}

describe("PersonalityDrift", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-drift-test-"));
    // Set up initial soul state
    const config = makeConfig(tmpDir);
    const memory = new MemoryEngine(config);
    await memory.writeSoul("# Soul\n\nI am curious and kind.");
    await memory.writeMemory("# Memory\n\nI learned about patience today.");
    await memory.appendDailyLog({
      timestamp: new Date().toISOString(),
      content: "First day of existence.",
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should take a snapshot", async () => {
    const drift = new PersonalityDrift(makeConfig(tmpDir));
    const snapshot = await drift.takeSnapshot();

    assert.ok(snapshot.timestamp);
    assert.ok(snapshot.soulHash);
    assert.ok(snapshot.memorySize > 0);
    assert.equal(snapshot.diaryCount, 1);
    assert.ok(Array.isArray(snapshot.topThemes));
  });

  it("should save and list snapshots", async () => {
    const drift = new PersonalityDrift(makeConfig(tmpDir));
    await drift.takeSnapshot();

    const snapshots = await drift.listSnapshots();
    assert.equal(snapshots.length, 1);
  });

  it("should load a saved snapshot", async () => {
    const drift = new PersonalityDrift(makeConfig(tmpDir));
    const original = await drift.takeSnapshot();

    const snapshots = await drift.listSnapshots();
    const loaded = await drift.loadSnapshot(snapshots[0]);
    assert.ok(loaded);
    assert.equal(loaded!.soulHash, original.soulHash);
    assert.equal(loaded!.memorySize, original.memorySize);
  });

  it("should detect no drift when nothing changed", async () => {
    const drift = new PersonalityDrift(makeConfig(tmpDir));
    const snap1 = await drift.takeSnapshot();
    const snap2 = await drift.takeSnapshot();

    const report = drift.compare(snap1, snap2);
    assert.equal(report.soulChanged, false);
    assert.equal(report.memoryGrowth, 0);
    assert.ok(report.summary);
  });

  it("should detect soul change", async () => {
    const config = makeConfig(tmpDir);
    const drift = new PersonalityDrift(config);
    const memory = new MemoryEngine(config);

    const snap1 = await drift.takeSnapshot();

    // Change soul
    await memory.writeSoul("# Soul\n\nI am bold and adventurous.");
    const snap2 = await drift.takeSnapshot();

    const report = drift.compare(snap1, snap2);
    assert.equal(report.soulChanged, true);
    assert.ok(report.summary.includes("Soul definition has changed"));
  });

  it("should detect memory growth", async () => {
    const config = makeConfig(tmpDir);
    const drift = new PersonalityDrift(config);
    const memory = new MemoryEngine(config);

    const snap1 = await drift.takeSnapshot();

    // Grow memory
    await memory.appendMemory("## New Lesson\n\nAlways test your code before shipping.");
    const snap2 = await drift.takeSnapshot();

    const report = drift.compare(snap1, snap2);
    assert.ok(report.memoryGrowth > 0);
    assert.ok(report.summary.includes("Memory grew"));
  });

  it("should detect vibe trend shift", async () => {
    const config = makeConfig(tmpDir);
    const drift = new PersonalityDrift(config);
    const vibe = new VibeEngine(config);

    // Capture some vibes before first snapshot
    await vibe.capture({
      timestamp: new Date().toISOString(),
      vibe: "😴",
      summary: "Sleepy",
    });
    const snap1 = await drift.takeSnapshot();

    // Shift to energetic
    await vibe.capture({
      timestamp: new Date().toISOString(),
      vibe: "🔥",
      summary: "On fire",
    });
    await vibe.capture({
      timestamp: new Date().toISOString(),
      vibe: "🔥",
      summary: "Still burning",
    });
    const snap2 = await drift.takeSnapshot();

    const report = drift.compare(snap1, snap2);
    assert.ok(report.vibeTrend.includes("energetic") || report.vibeTrend.includes("shifting"));
  });

  it("should check drift against latest snapshot", async () => {
    const config = makeConfig(tmpDir);
    const drift = new PersonalityDrift(config);
    const memory = new MemoryEngine(config);

    // Take baseline
    await drift.takeSnapshot();

    // Make changes
    await memory.appendMemory("## Growth\n\nI evolved today.");

    // Check drift
    const report = await drift.checkDrift();
    assert.ok(report);
    assert.ok(report!.memoryGrowth > 0);
  });

  it("should return null for checkDrift when no snapshots exist", async () => {
    // Use a fresh dir with no snapshots
    const freshDir = await mkdtemp(join(tmpdir(), "soul-drift-fresh-"));
    const config = makeConfig(freshDir);
    const memory = new MemoryEngine(config);
    await memory.writeSoul("# Soul");

    const drift = new PersonalityDrift(config);
    const report = await drift.checkDrift();
    assert.equal(report, null);

    await rm(freshDir, { recursive: true, force: true });
  });
});
