/**
 * Agent Soul Kit — Shared Memory (Phase 4)
 *
 * A simple protocol for multiple agents to share memories and coordinate.
 * Inspired by our own coordination/ directory — the 日月星辰 family's shared space.
 *
 * Design: file-based pub/sub. Each agent publishes to topics, others can read.
 * No database, no server — just files in a shared directory.
 *
 * @author Sia
 */

import { readFile, writeFile, readdir, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { SharedMessage, SoulKitConfig } from "./types.js";

export class SharedMemory {
  private sharedDir: string;
  private agentName: string;

  constructor(config: SoulKitConfig, sharedDir?: string) {
    this.agentName = config.soul.name;
    this.sharedDir = join(config.baseDir, sharedDir ?? "coordination");
  }

  // ─── Publish ──────────────────────────────────────────────

  /**
   * Publish a message to a topic.
   * Creates a markdown file in coordination/<topic>.md, appending the message.
   */
  async publish(topic: string, content: string, metadata?: Record<string, string>): Promise<SharedMessage> {
    const message: SharedMessage = {
      agent: this.agentName,
      topic,
      timestamp: new Date().toISOString(),
      content,
      metadata,
    };

    const topicPath = this.topicPath(topic);
    await mkdir(dirname(topicPath), { recursive: true });

    let existing: string;
    try {
      existing = await readFile(topicPath, "utf-8");
    } catch {
      existing = `# ${topic}\n\n`;
    }

    const time = message.timestamp.slice(0, 16).replace("T", " ");
    const meta = metadata
      ? Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(" | ")
      : "";
    const metaLine = meta ? `\n> ${meta}` : "";
    const entry = `### [${time}] ${this.agentName}${metaLine}\n\n${content.trim()}\n\n---\n`;

    await writeFile(topicPath, existing + entry, "utf-8");
    return message;
  }

  // ─── Read ─────────────────────────────────────────────────

  /**
   * Read all messages from a topic.
   */
  async read(topic: string): Promise<SharedMessage[]> {
    const topicPath = this.topicPath(topic);
    let content: string;
    try {
      content = await readFile(topicPath, "utf-8");
    } catch {
      return [];
    }

    return this.parseMessages(topic, content);
  }

  /**
   * Read the latest N messages from a topic.
   */
  async readLatest(topic: string, limit = 5): Promise<SharedMessage[]> {
    const all = await this.read(topic);
    return all.slice(-limit);
  }

  /**
   * Read messages from a specific agent.
   */
  async readFrom(topic: string, agent: string): Promise<SharedMessage[]> {
    const all = await this.read(topic);
    return all.filter((m) => m.agent === agent);
  }

  // ─── Topics ───────────────────────────────────────────────

  /**
   * List all available topics.
   */
  async listTopics(): Promise<string[]> {
    try {
      const files = await readdir(this.sharedDir);
      return files
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(".md", ""));
    } catch {
      return [];
    }
  }

  /**
   * Get topic stats (message count, last update, participating agents).
   */
  async topicStats(topic: string): Promise<{
    messageCount: number;
    lastUpdate: string | null;
    agents: string[];
  }> {
    const messages = await this.read(topic);
    const agents = [...new Set(messages.map((m) => m.agent))];
    const lastUpdate = messages.length > 0
      ? messages[messages.length - 1].timestamp
      : null;

    return { messageCount: messages.length, lastUpdate, agents };
  }

  // ─── Shared State ─────────────────────────────────────────

  /**
   * Write a shared state file (like active_context.md — single source of truth).
   * Unlike publish (append), this replaces the entire file.
   */
  async writeState(name: string, content: string): Promise<void> {
    const path = join(this.sharedDir, `${name}.md`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
  }

  /**
   * Read a shared state file.
   */
  async readState(name: string): Promise<string> {
    const path = join(this.sharedDir, `${name}.md`);
    try {
      return await readFile(path, "utf-8");
    } catch {
      return "";
    }
  }

  // ─── Internal ─────────────────────────────────────────────

  private topicPath(topic: string): string {
    return join(this.sharedDir, `${topic}.md`);
  }

  private parseMessages(topic: string, content: string): SharedMessage[] {
    const messages: SharedMessage[] = [];
    const blocks = content.split("---").filter((b) => b.trim());

    const headerRe = /###\s*\[(.+?)\]\s*(.+)/;

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const headerLine = lines.find((l) => headerRe.test(l));
      if (!headerLine) continue;

      const match = headerRe.exec(headerLine);
      if (!match) continue;

      const timestamp = match[1].trim().replace(" ", "T") + ":00.000Z";
      const agent = match[2].trim();

      // Extract metadata (lines starting with >)
      const metaLines = lines.filter((l) => l.startsWith(">"));
      const metadata: Record<string, string> = {};
      for (const ml of metaLines) {
        const pairs = ml.replace(/^>\s*/, "").split(" | ");
        for (const pair of pairs) {
          const [k, v] = pair.split(": ");
          if (k && v) metadata[k.trim()] = v.trim();
        }
      }

      // Content is everything after header and metadata (skip topic headers too)
      const contentLines = lines.filter(
        (l) => !headerRe.test(l) && !l.startsWith(">") && !l.startsWith("# ") && l.trim()
      );

      messages.push({
        agent,
        topic,
        timestamp,
        content: contentLines.join("\n").trim(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }

    return messages;
  }
}
