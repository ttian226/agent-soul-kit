import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryEngine } from "../memory.js";
import type { SoulKitConfig } from "../types.js";

describe("MemoryEngine", () => {
  let baseDir: string;
  let engine: MemoryEngine;

  before(async () => {
    baseDir = await mkdtemp(join(tmpdir(), "soul-kit-test-"));
    const config: SoulKitConfig = {
      baseDir,
      soul: {
        name: "TestAgent",
        identity: "A test agent",
        traits: ["curious", "helpful"],
        guidelines: ["Be honest"],
      },
    };
    engine = new MemoryEngine(config);
  });

  after(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  // ─── L1 Tests ──────────────────────────────────────────

  it("should read empty active context when file does not exist", async () => {
    const result = await engine.readActiveContext();
    assert.equal(result, "");
  });

  it("should write and read active context", async () => {
    const content = "# Active Context\n\nCurrently working on tests.";
    await engine.writeActiveContext(content);
    const result = await engine.readActiveContext();
    assert.equal(result, content);
  });

  it("should update a section in active context", async () => {
    await engine.writeActiveContext(
      "# Context\n\n## Status\nOld status\n\n## Tasks\nSome tasks\n"
    );
    await engine.updateActiveContextSection("Status", "New status");
    const result = await engine.readActiveContext();
    assert.ok(result.includes("New status"));
    assert.ok(result.includes("Some tasks"));
    assert.ok(!result.includes("Old status"));
  });

  // ─── L2 Tests ──────────────────────────────────────────

  it("should read empty memory when file does not exist", async () => {
    const result = await engine.readMemory();
    assert.equal(result, "");
  });

  it("should append to memory", async () => {
    await engine.writeMemory("# Memory\n\nFirst entry.");
    await engine.appendMemory("## Lesson\nDon't trust muscle memory.");
    const result = await engine.readMemory();
    assert.ok(result.includes("First entry"));
    assert.ok(result.includes("Don't trust muscle memory"));
  });

  // ─── L3 Tests ──────────────────────────────────────────

  it("should append and read daily log", async () => {
    await engine.appendDailyLog({
      timestamp: new Date().toISOString(),
      content: "Tested the memory engine. It works!",
      tags: ["test", "milestone"],
    });
    const log = await engine.readDailyLog();
    assert.ok(log.includes("Tested the memory engine"));
    assert.ok(log.includes("test, milestone"));
  });

  it("should list daily logs", async () => {
    const dates = await engine.listDailyLogs();
    assert.ok(dates.length > 0);
  });

  // ─── Soul Tests ────────────────────────────────────────

  it("should write and read soul file", async () => {
    const soul = "# Soul\n\nI am TestAgent. I am curious.";
    await engine.writeSoul(soul);
    const result = await engine.readSoul();
    assert.equal(result, soul);
  });

  // ─── Diary Tests ───────────────────────────────────────

  it("should append and read diary", async () => {
    await engine.appendDiary({
      timestamp: new Date().toISOString(),
      title: "Afternoon thoughts",
      content: "The weather is nice today.",
    });
    const diary = await engine.readDiary();
    assert.ok(diary.includes("Afternoon thoughts"));
    assert.ok(diary.includes("The weather is nice today."));
    assert.ok(diary.includes("weather is nice"));
  });

  // ─── Search Tests ──────────────────────────────────────

  it("should search across layers", async () => {
    const results = await engine.search("memory engine");
    assert.ok(results.length > 0);
    assert.ok(results[0].score > 0);
  });

  // ─── Boot Context Tests ────────────────────────────────

  it("should generate boot context", async () => {
    const ctx = await engine.bootContext();
    assert.ok(ctx.includes("Soul"));
    assert.ok(ctx.includes("Active Context"));
    assert.ok(ctx.includes("Memory"));
  });
});
