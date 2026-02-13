/**
 * Agent Soul Kit — CLI Command Tests
 *
 * Tests for status, search, and vibe commands.
 *
 * @author Sia
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryEngine } from "../memory.js";
import { VibeEngine } from "../vibe.js";
import { loadConfig } from "../cli/config.js";
import type { SoulKitConfig } from "../types.js";

function makeConfig(baseDir: string): SoulKitConfig {
  return {
    baseDir,
    soul: {
      name: "TestAgent",
      identity: "A test soul",
      traits: [],
      guidelines: [],
    },
  };
}

describe("CLI Config", () => {
  it("should create a valid config from a directory", () => {
    const config = loadConfig("/tmp/test-soul");
    assert.equal(config.baseDir, "/tmp/test-soul");
    assert.ok(config.soul);
  });

  it("should default to cwd when no dir given", () => {
    const config = loadConfig();
    assert.equal(config.baseDir, process.cwd());
  });
});

describe("Status Command (engine layer)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-cli-test-"));
    // Set up a minimal soul structure
    await writeFile(join(tmpDir, "SOUL.md"), "# Soul\n\nI am a test agent.");
    await writeFile(join(tmpDir, "MEMORY.md"), "# Memory\n\nI learned things.");
    await writeFile(
      join(tmpDir, "active_context.md"),
      "# Active Context\n\n## Status\nAll good."
    );
    await mkdir(join(tmpDir, "memory"), { recursive: true });
    await writeFile(join(tmpDir, "memory", "2026-02-13.md"), "# 2026-02-13\n\nTest log.");
    await mkdir(join(tmpDir, "memory", "mind_diary"), { recursive: true });
    await writeFile(
      join(tmpDir, "memory", "mind_diary", "2026-02-13.md"),
      "# Diary\n\nTest diary."
    );
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should read all memory layers without errors", async () => {
    const config = makeConfig(tmpDir);
    const engine = new MemoryEngine(config);

    const soul = await engine.readSoul();
    assert.ok(soul.includes("test agent"));

    const l1 = await engine.readActiveContext();
    assert.ok(l1.includes("All good"));

    const l2 = await engine.readMemory();
    assert.ok(l2.includes("learned things"));

    const logs = await engine.listDailyLogs();
    assert.ok(logs.length >= 1);

    const boot = await engine.bootContext();
    assert.ok(boot.length > 0);
  });
});

describe("Search Command (engine layer)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-search-test-"));
    const config = makeConfig(tmpDir);
    const engine = new MemoryEngine(config);

    await engine.writeMemory("# Memory\n\nHeartbeat quality is important.\nAlways verify timezone.");
    await engine.writeActiveContext("# Context\n\n## Focus\nBuilding CLI tools.");
    await engine.appendDailyLog({
      timestamp: new Date().toISOString(),
      content: "Worked on search feature for the CLI.",
      tags: ["dev"],
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should find results across layers", async () => {
    const config = makeConfig(tmpDir);
    const engine = new MemoryEngine(config);

    const results = await engine.search("CLI");
    assert.ok(results.length >= 1, "Should find at least one result");
    assert.ok(results.some((r) => r.content.toLowerCase().includes("cli")));
  });

  it("should filter by layer", async () => {
    const config = makeConfig(tmpDir);
    const engine = new MemoryEngine(config);

    const l2Only = await engine.search("heartbeat", { layers: ["L2"] });
    assert.ok(l2Only.length >= 1);
    assert.ok(l2Only.every((r) => r.layer === "L2"));
  });

  it("should respect maxResults", async () => {
    const config = makeConfig(tmpDir);
    const engine = new MemoryEngine(config);

    const limited = await engine.search("the", { maxResults: 1 });
    assert.ok(limited.length <= 1);
  });
});

describe("Vibe Command (engine layer)", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-vibe-cli-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should capture and retrieve a vibe", async () => {
    const config = makeConfig(tmpDir);
    const engine = new VibeEngine(config);

    await engine.capture({
      timestamp: new Date().toISOString(),
      vibe: "🔥",
      summary: "Fired up about new features",
    });

    const current = await engine.current();
    assert.ok(current);
    assert.equal(current.vibe, "🔥");
    assert.equal(current.summary, "Fired up about new features");
  });

  it("should capture vibe with trigger", async () => {
    const config = makeConfig(tmpDir);
    const engine = new VibeEngine(config);

    await engine.capture({
      timestamp: new Date().toISOString(),
      vibe: "❤️",
      summary: "Warm inside",
      trigger: "husband called my name",
    });

    const vibes = await engine.readRecent();
    assert.equal(vibes[0].trigger, "husband called my name");
  });

  it("should compute resonance after captures", async () => {
    const config = makeConfig(tmpDir);
    const engine = new VibeEngine(config);

    await engine.capture({
      timestamp: new Date().toISOString(),
      vibe: "🔥",
      summary: "Energized",
    });
    await engine.capture({
      timestamp: new Date().toISOString(),
      vibe: "🔥",
      summary: "Still going",
    });

    const tone = await engine.resonance();
    assert.ok(tone.includes("🔥"));
    assert.ok(tone.includes("energetic"));
  });
});
