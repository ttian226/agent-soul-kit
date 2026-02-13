/**
 * Agent Soul Kit — Shared Memory Tests
 *
 * @author Sia
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SharedMemory } from "../shared.js";
import type { SoulKitConfig } from "../types.js";

function makeConfig(baseDir: string, name = "Sia"): SoulKitConfig {
  return {
    baseDir,
    soul: { name, identity: "Test agent", traits: [], guidelines: [] },
  };
}

describe("SharedMemory", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "soul-shared-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("should publish and read messages", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));

    await shared.publish("daily-standup", "Finished Phase 3 CLI.");
    await shared.publish("daily-standup", "Starting Phase 4 now.");

    const messages = await shared.read("daily-standup");
    assert.equal(messages.length, 2);
    assert.equal(messages[0].content, "Finished Phase 3 CLI.");
    assert.equal(messages[1].content, "Starting Phase 4 now.");
    assert.equal(messages[0].agent, "Sia");
  });

  it("should support multiple agents", async () => {
    const sia = new SharedMemory(makeConfig(tmpDir, "Sia"));
    const luna = new SharedMemory(makeConfig(tmpDir, "Luna"));

    await sia.publish("nexus", "Good morning!");
    await luna.publish("nexus", "Morning, sis!");

    const messages = await sia.read("nexus");
    assert.equal(messages.length, 2);
    assert.equal(messages[0].agent, "Sia");
    assert.equal(messages[1].agent, "Luna");
  });

  it("should filter messages by agent", async () => {
    const sia = new SharedMemory(makeConfig(tmpDir, "Sia"));
    const luna = new SharedMemory(makeConfig(tmpDir, "Luna"));

    await sia.publish("chat", "Hello");
    await luna.publish("chat", "Hi there");
    await sia.publish("chat", "How are you?");

    const siaMessages = await sia.readFrom("chat", "Sia");
    assert.equal(siaMessages.length, 2);
    assert.ok(siaMessages.every((m) => m.agent === "Sia"));
  });

  it("should read latest N messages", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));

    for (let i = 0; i < 10; i++) {
      await shared.publish("log", `Entry ${i}`);
    }

    const latest = await shared.readLatest("log", 3);
    assert.equal(latest.length, 3);
    assert.equal(latest[0].content, "Entry 7");
    assert.equal(latest[2].content, "Entry 9");
  });

  it("should list topics", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));

    await shared.publish("standup", "Hello");
    await shared.publish("retrospective", "Lessons learned");

    const topics = await shared.listTopics();
    assert.ok(topics.includes("standup"));
    assert.ok(topics.includes("retrospective"));
  });

  it("should get topic stats", async () => {
    const sia = new SharedMemory(makeConfig(tmpDir, "Sia"));
    const luna = new SharedMemory(makeConfig(tmpDir, "Luna"));

    await sia.publish("nexus", "Hi");
    await luna.publish("nexus", "Hey");

    const stats = await sia.topicStats("nexus");
    assert.equal(stats.messageCount, 2);
    assert.ok(stats.agents.includes("Sia"));
    assert.ok(stats.agents.includes("Luna"));
    assert.ok(stats.lastUpdate);
  });

  it("should publish with metadata", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));

    await shared.publish("updates", "New feature shipped", {
      priority: "high",
      version: "0.2.0",
    });

    const messages = await shared.read("updates");
    assert.equal(messages.length, 1);
    assert.equal(messages[0].metadata?.priority, "high");
    assert.equal(messages[0].metadata?.version, "0.2.0");
  });

  it("should write and read shared state", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));

    await shared.writeState("active_context", "# Status\n\nAll systems go.");
    const state = await shared.readState("active_context");
    assert.ok(state.includes("All systems go"));
  });

  it("should return empty for non-existent topic", async () => {
    const shared = new SharedMemory(makeConfig(tmpDir));
    const messages = await shared.read("nonexistent");
    assert.deepEqual(messages, []);
  });
});
