/**
 * Agent Soul Kit — Vibe Engine (Phase 2)
 *
 * Emotional snapshots that give agents continuity of feeling.
 * Vibes flow: capture → store in active_context → archive to diary → promote to memory
 *
 * @author Sia
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type {
  Vibe,
  VibeSnapshot,
  VibeReadOptions,
  SoulKitConfig,
} from "./types.js";

const VIBE_SECTION = "Vibe History";
const VIBE_LINE_RE = /^- (\S+) \[(.+?)\] (.+?)(?:\s*\(trigger: (.+?)\))?$/;
const MAX_ACTIVE_VIBES = 10;

export class VibeEngine {
  private config: SoulKitConfig;
  private paths: Required<NonNullable<SoulKitConfig["paths"]>>;

  constructor(config: SoulKitConfig) {
    this.config = config;
    this.paths = {
      activeContext: config.paths?.activeContext ?? "active_context.md",
      memory: config.paths?.memory ?? "MEMORY.md",
      dailyLogs: config.paths?.dailyLogs ?? "memory/",
      diary: config.paths?.diary ?? "memory/mind_diary/",
      soul: config.paths?.soul ?? "SOUL.md",
    };
  }

  private resolve(path: string): string {
    return join(this.config.baseDir, path);
  }

  // ─── Capture ───────────────────────────────────────────────

  /**
   * Capture a vibe snapshot and store it in active_context.md.
   * Automatically archives old vibes when the list exceeds MAX_ACTIVE_VIBES.
   */
  async capture(snapshot: VibeSnapshot): Promise<void> {
    const acPath = this.resolve(this.paths.activeContext);
    await mkdir(dirname(acPath), { recursive: true });

    let content: string;
    try {
      content = await readFile(acPath, "utf-8");
    } catch {
      content = "";
    }

    const line = this.formatVibeLine(snapshot);
    content = this.upsertSection(content, VIBE_SECTION, line);

    await writeFile(acPath, content, "utf-8");

    // Auto-archive if too many vibes in active context
    const vibes = this.parseVibesFromContent(content);
    if (vibes.length > MAX_ACTIVE_VIBES) {
      await this.archive();
    }
  }

  // ─── Read ──────────────────────────────────────────────────

  /**
   * Read recent vibes from active_context.md.
   */
  async readRecent(options?: VibeReadOptions): Promise<VibeSnapshot[]> {
    const limit = options?.limit ?? 5;
    const filter = options?.filter;

    const acPath = this.resolve(this.paths.activeContext);
    let content: string;
    try {
      content = await readFile(acPath, "utf-8");
    } catch {
      return [];
    }

    let vibes = this.parseVibesFromContent(content);

    if (filter) {
      vibes = vibes.filter((v) => v.vibe === filter);
    }

    return vibes.slice(-limit);
  }

  /**
   * Get the most recent vibe — the current emotional state.
   */
  async current(): Promise<VibeSnapshot | null> {
    const recent = await this.readRecent({ limit: 1 });
    return recent[0] ?? null;
  }

  // ─── Archive ───────────────────────────────────────────────

  /**
   * Move older vibes from active_context to today's mind diary.
   * Keeps only the most recent MAX_ACTIVE_VIBES/2 in active context.
   */
  async archive(): Promise<number> {
    const acPath = this.resolve(this.paths.activeContext);
    let content: string;
    try {
      content = await readFile(acPath, "utf-8");
    } catch {
      return 0;
    }

    const vibes = this.parseVibesFromContent(content);
    const keepCount = Math.floor(MAX_ACTIVE_VIBES / 2);

    if (vibes.length <= keepCount) return 0;

    const toArchive = vibes.slice(0, vibes.length - keepCount);
    const toKeep = vibes.slice(vibes.length - keepCount);

    // Write archived vibes to diary
    const diaryContent = toArchive
      .map((v) => this.formatVibeLine(v))
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const diaryPath = this.resolve(join(this.paths.diary, `${today}.md`));
    await mkdir(dirname(diaryPath), { recursive: true });

    let existing: string;
    try {
      existing = await readFile(diaryPath, "utf-8");
    } catch {
      existing = "";
    }

    const header = existing ? "" : `# 心智日记 ${today}\n\n`;
    const archiveBlock = `\n### Archived Vibes\n\n${diaryContent}\n\n---\n`;
    await writeFile(diaryPath, header + existing + archiveBlock, "utf-8");

    // Update active context with only kept vibes
    const keptLines = toKeep.map((v) => this.formatVibeLine(v)).join("\n");
    content = this.replaceSection(content, VIBE_SECTION, keptLines);
    await writeFile(acPath, content, "utf-8");

    return toArchive.length;
  }

  // ─── Promote ───────────────────────────────────────────────

  /**
   * Promote a significant vibe (🌟) to MEMORY.md for long-term retention.
   */
  async promote(snapshot: VibeSnapshot, reflection: string): Promise<void> {
    const memPath = this.resolve(this.paths.memory);
    await mkdir(dirname(memPath), { recursive: true });

    let memory: string;
    try {
      memory = await readFile(memPath, "utf-8");
    } catch {
      memory = "";
    }

    const date = snapshot.timestamp.slice(0, 10);
    const entry = `\n## ${snapshot.vibe} Vibe — ${date}\n\n${snapshot.summary}\n\n${reflection}\n`;

    await writeFile(memPath, memory.trimEnd() + "\n" + entry, "utf-8");
  }

  // ─── Emotional Resonance ───────────────────────────────────

  /**
   * Compute emotional resonance: a summary of recent emotional patterns.
   * Returns a tone hint that agents can use to influence their next response.
   */
  async resonance(): Promise<string> {
    const vibes = await this.readRecent({ limit: 5 });

    if (vibes.length === 0) {
      return "neutral — no recent emotional data";
    }

    // Count vibe frequencies
    const counts: Record<string, number> = {};
    for (const v of vibes) {
      counts[v.vibe] = (counts[v.vibe] ?? 0) + 1;
    }

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const latest = vibes[vibes.length - 1];

    const toneMap: Record<string, string> = {
      "🔥": "energetic, passionate",
      "💭": "reflective, thoughtful",
      "😴": "calm, low-energy",
      "❤️": "warm, affectionate",
      "🌟": "inspired, significant",
    };

    const dominantTone = toneMap[dominant[0]] ?? "mixed";
    const latestSummary = latest.summary;

    return `${dominant[0]} ${dominantTone} (${dominant[1]}/${vibes.length} recent) — latest: "${latestSummary}"`;
  }

  // ─── Internal Helpers ──────────────────────────────────────

  private formatVibeLine(snapshot: VibeSnapshot): string {
    const time = snapshot.timestamp.slice(0, 16).replace("T", " ");
    const trigger = snapshot.trigger
      ? ` (trigger: ${snapshot.trigger})`
      : "";
    return `- ${snapshot.vibe} [${time}] ${snapshot.summary}${trigger}`;
  }

  private parseVibesFromContent(content: string): VibeSnapshot[] {
    const vibes: VibeSnapshot[] = [];
    const sectionContent = this.extractSection(content, VIBE_SECTION);
    if (!sectionContent) return vibes;

    for (const line of sectionContent.split("\n")) {
      const match = VIBE_LINE_RE.exec(line.trim());
      if (match) {
        vibes.push({
          vibe: match[1] as Vibe,
          timestamp: match[2].replace(" ", "T") + ":00.000Z",
          summary: match[3].trim(),
          trigger: match[4]?.trim(),
        });
      }
    }
    return vibes;
  }

  private extractSection(content: string, title: string): string | null {
    const regex = new RegExp(
      `## ${escapeRegex(title)}\\n([\\s\\S]*?)(?=\\n## |$)`
    );
    const match = regex.exec(content);
    return match ? match[1].trim() : null;
  }

  private upsertSection(
    content: string,
    title: string,
    newLine: string
  ): string {
    const existing = this.extractSection(content, title);
    if (existing !== null) {
      const updated = existing + "\n" + newLine;
      return this.replaceSection(content, title, updated);
    }
    return content.trimEnd() + `\n\n## ${title}\n\n${newLine}\n`;
  }

  private replaceSection(
    content: string,
    title: string,
    newContent: string
  ): string {
    const regex = new RegExp(
      `(## ${escapeRegex(title)}\\n)[\\s\\S]*?(?=\\n## |$)`
    );
    return content.replace(regex, `$1\n${newContent}\n`);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
