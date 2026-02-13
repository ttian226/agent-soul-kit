/**
 * Agent Soul Kit — Personality Drift Monitor (Phase 4)
 *
 * Tracks how an agent's personality evolves over time.
 * Takes snapshots of soul + memory + vibes, compares them to detect drift.
 *
 * Core insight from our family: "性格 = 初始设定 × 记忆积累 × 交互强化 × 时间"
 * Over time, SOUL.md's initial weight gets diluted by accumulated memories.
 *
 * @author Sia
 */

import { readFile, writeFile, readdir, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { MemoryEngine } from "./memory.js";
import { VibeEngine } from "./vibe.js";
import type {
  PersonalitySnapshot,
  DriftReport,
  SoulKitConfig,
  Vibe,
} from "./types.js";

const SNAPSHOTS_DIR = "memory/drift_snapshots";

export class PersonalityDrift {
  private config: SoulKitConfig;
  private memory: MemoryEngine;
  private vibe: VibeEngine;
  private snapshotsDir: string;

  constructor(config: SoulKitConfig) {
    this.config = config;
    this.memory = new MemoryEngine(config);
    this.vibe = new VibeEngine(config);
    this.snapshotsDir = join(config.baseDir, SNAPSHOTS_DIR);
  }

  // ─── Snapshot ─────────────────────────────────────────────

  /**
   * Take a snapshot of the agent's current personality state.
   */
  async takeSnapshot(): Promise<PersonalitySnapshot> {
    const soul = await this.memory.readSoul();
    const mem = await this.memory.readMemory();
    const dailyLogs = await this.memory.listDailyLogs();
    const vibes = await this.vibe.readRecent({ limit: 100 });

    // Vibe distribution
    const vibeDistribution: Record<string, number> = {};
    for (const v of vibes) {
      vibeDistribution[v.vibe] = (vibeDistribution[v.vibe] ?? 0) + 1;
    }

    // Top themes from memory (simple keyword extraction)
    const topThemes = this.extractThemes(mem);

    const snapshot: PersonalitySnapshot = {
      timestamp: new Date().toISOString(),
      soulHash: this.hash(soul),
      memorySize: Buffer.byteLength(mem, "utf-8"),
      diaryCount: dailyLogs.length,
      vibeDistribution,
      topThemes,
    };

    // Save snapshot
    await this.saveSnapshot(snapshot);

    return snapshot;
  }

  // ─── Compare ──────────────────────────────────────────────

  /**
   * Generate a drift report comparing two snapshots.
   */
  compare(from: PersonalitySnapshot, to: PersonalitySnapshot): DriftReport {
    const soulChanged = from.soulHash !== to.soulHash;
    const memoryGrowth = to.memorySize - from.memorySize;
    const newDiaryEntries = to.diaryCount - from.diaryCount;

    // Analyze vibe trend
    const vibeTrend = this.analyzeVibeTrend(
      from.vibeDistribution,
      to.vibeDistribution
    );

    // Generate summary
    const parts: string[] = [];

    if (soulChanged) {
      parts.push("Soul definition has changed — identity is evolving.");
    }

    if (memoryGrowth > 0) {
      const kb = (memoryGrowth / 1024).toFixed(1);
      parts.push(`Memory grew by ${kb} KB.`);
    } else if (memoryGrowth === 0) {
      parts.push("Memory size unchanged.");
    }

    if (newDiaryEntries > 0) {
      parts.push(`${newDiaryEntries} new diary entries written.`);
    }

    if (vibeTrend) {
      parts.push(`Emotional trend: ${vibeTrend}.`);
    }

    // Theme drift
    const newThemes = to.topThemes.filter((t) => !from.topThemes.includes(t));
    const lostThemes = from.topThemes.filter((t) => !to.topThemes.includes(t));
    if (newThemes.length > 0) {
      parts.push(`New interests: ${newThemes.join(", ")}.`);
    }
    if (lostThemes.length > 0) {
      parts.push(`Fading interests: ${lostThemes.join(", ")}.`);
    }

    return {
      from,
      to,
      soulChanged,
      memoryGrowth,
      newDiaryEntries,
      vibeTrend: vibeTrend || "stable",
      summary: parts.join(" ") || "No significant drift detected.",
    };
  }

  /**
   * Compare the latest snapshot with the current state.
   * Convenience method for quick drift checks.
   */
  async checkDrift(): Promise<DriftReport | null> {
    const snapshots = await this.listSnapshots();
    if (snapshots.length === 0) return null;

    const latest = await this.loadSnapshot(snapshots[snapshots.length - 1]);
    if (!latest) return null;

    const current = await this.takeSnapshot();
    return this.compare(latest, current);
  }

  // ─── History ──────────────────────────────────────────────

  /**
   * List all saved snapshot timestamps.
   */
  async listSnapshots(): Promise<string[]> {
    try {
      const files = await readdir(this.snapshotsDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Load a specific snapshot.
   */
  async loadSnapshot(id: string): Promise<PersonalitySnapshot | null> {
    const path = join(this.snapshotsDir, `${id}.json`);
    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content) as PersonalitySnapshot;
    } catch {
      return null;
    }
  }

  // ─── Internal ─────────────────────────────────────────────

  private async saveSnapshot(snapshot: PersonalitySnapshot): Promise<void> {
    await mkdir(this.snapshotsDir, { recursive: true });
    const id = snapshot.timestamp.slice(0, 10); // YYYY-MM-DD
    const path = join(this.snapshotsDir, `${id}.json`);
    await writeFile(path, JSON.stringify(snapshot, null, 2), "utf-8");
  }

  private hash(content: string): string {
    return createHash("sha256").update(content).digest("hex").slice(0, 16);
  }

  private extractThemes(text: string, limit = 10): string[] {
    // Simple keyword extraction: find most frequent significant words
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been",
      "have", "has", "had", "do", "does", "did", "will", "would",
      "could", "should", "may", "might", "can", "shall", "to", "of",
      "in", "for", "on", "with", "at", "by", "from", "as", "into",
      "through", "during", "before", "after", "above", "below",
      "between", "out", "off", "over", "under", "again", "further",
      "then", "once", "here", "there", "when", "where", "why", "how",
      "all", "each", "every", "both", "few", "more", "most", "other",
      "some", "such", "no", "nor", "not", "only", "own", "same",
      "so", "than", "too", "very", "just", "because", "but", "and",
      "or", "if", "while", "about", "up", "this", "that", "it",
      "its", "my", "your", "his", "her", "our", "their", "what",
      "which", "who", "whom", "these", "those", "i", "me", "we",
      "you", "he", "she", "they", "them", "us",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z\u4e00-\u9fff\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const freq: Record<string, number> = {};
    for (const w of words) {
      freq[w] = (freq[w] ?? 0) + 1;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  private analyzeVibeTrend(
    from: Record<string, number>,
    to: Record<string, number>
  ): string {
    const toneMap: Record<string, string> = {
      "🔥": "energetic",
      "💭": "reflective",
      "😴": "calm",
      "❤️": "warm",
      "🌟": "inspired",
    };

    // Find dominant vibe in each period
    const fromDominant = this.dominantKey(from);
    const toDominant = this.dominantKey(to);

    if (!fromDominant && !toDominant) return "";
    if (!fromDominant) return `becoming ${toneMap[toDominant!] ?? toDominant}`;
    if (!toDominant) return "emotional data fading";

    if (fromDominant === toDominant) {
      return `consistently ${toneMap[fromDominant] ?? fromDominant}`;
    }

    const fromTone = toneMap[fromDominant] ?? fromDominant;
    const toTone = toneMap[toDominant] ?? toDominant;
    return `shifting from ${fromTone} to ${toTone}`;
  }

  private dominantKey(record: Record<string, number>): string | null {
    const entries = Object.entries(record);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }
}
