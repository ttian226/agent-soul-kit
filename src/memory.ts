/**
 * Agent Soul Kit — Three-Layer Memory Engine
 *
 * The core of what makes an agent "remember."
 * File-driven, zero-database, human-readable.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import type {
  ActiveContext,
  DailyLogEntry,
  MemoryLayer,
  SoulKitConfig,
  SearchResult,
  SearchOptions,
} from "./types.js";

export class MemoryEngine {
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

  // ─── Path Helpers ────────────────────────────────────────

  private resolve(relativePath: string): string {
    return join(this.config.baseDir, relativePath);
  }

  private todayStr(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // ─── L1: Active Context ──────────────────────────────────

  /** Read the active context (L1 — hot layer) */
  async readActiveContext(): Promise<string> {
    const path = this.resolve(this.paths.activeContext);
    try {
      return await readFile(path, "utf-8");
    } catch {
      return "";
    }
  }

  /** Write/overwrite the active context */
  async writeActiveContext(content: string): Promise<void> {
    const path = this.resolve(this.paths.activeContext);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
  }

  /** Update a specific section in active context (preserves other sections) */
  async updateActiveContextSection(
    sectionTitle: string,
    content: string
  ): Promise<void> {
    const current = await this.readActiveContext();
    const sectionRegex = new RegExp(
      `(## ${escapeRegex(sectionTitle)}\\n)([\\s\\S]*?)(?=\\n## |$)`,
      "m"
    );

    let updated: string;
    if (sectionRegex.test(current)) {
      updated = current.replace(sectionRegex, `$1${content}\n`);
    } else {
      updated = current.trimEnd() + `\n\n## ${sectionTitle}\n${content}\n`;
    }

    await this.writeActiveContext(updated);
  }

  // ─── L2: Curated Memory ──────────────────────────────────

  /** Read the curated long-term memory (L2 — warm layer) */
  async readMemory(): Promise<string> {
    const path = this.resolve(this.paths.memory);
    try {
      return await readFile(path, "utf-8");
    } catch {
      return "";
    }
  }

  /** Append content to the curated memory */
  async appendMemory(content: string): Promise<void> {
    const path = this.resolve(this.paths.memory);
    await mkdir(dirname(path), { recursive: true });
    const current = await this.readMemory();
    const updated = current.trimEnd() + "\n\n" + content.trim() + "\n";
    await writeFile(path, updated, "utf-8");
  }

  /** Replace the entire curated memory (use with caution!) */
  async writeMemory(content: string): Promise<void> {
    const path = this.resolve(this.paths.memory);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
  }

  // ─── L3: Daily Logs ──────────────────────────────────────

  /** Get today's daily log path */
  private dailyLogPath(date?: string): string {
    const d = date ?? this.todayStr();
    return this.resolve(join(this.paths.dailyLogs, `${d}.md`));
  }

  /** Read a daily log (defaults to today) */
  async readDailyLog(date?: string): Promise<string> {
    try {
      return await readFile(this.dailyLogPath(date), "utf-8");
    } catch {
      return "";
    }
  }

  /** Append an entry to today's daily log */
  async appendDailyLog(entry: DailyLogEntry): Promise<void> {
    const path = this.dailyLogPath();
    await mkdir(dirname(path), { recursive: true });

    const current = await this.readDailyLog();
    const header = current
      ? ""
      : `# ${this.todayStr()}\n\n`;

    const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const tags = entry.tags?.length ? ` [${entry.tags.join(", ")}]` : "";
    const block = `### ${time}${tags}\n\n${entry.content.trim()}\n\n---\n`;

    await writeFile(path, header + current + block, "utf-8");
  }

  /** List available daily log dates (most recent first) */
  async listDailyLogs(): Promise<string[]> {
    const dir = this.resolve(this.paths.dailyLogs);
    try {
      const files = await readdir(dir);
      return files
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
        .map((f) => f.replace(".md", ""))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }

  // ─── Mind Diary ──────────────────────────────────────────

  /** Get today's mind diary path */
  private diaryPath(date?: string): string {
    const d = date ?? this.todayStr();
    return this.resolve(join(this.paths.diary, `${d}.md`));
  }

  /** Read the mind diary for a date (defaults to today) */
  async readDiary(date?: string): Promise<string> {
    try {
      return await readFile(this.diaryPath(date), "utf-8");
    } catch {
      return "";
    }
  }

  /** Append a diary entry */
  async appendDiary(time: string, title: string, content: string): Promise<void> {
    const path = this.diaryPath();
    await mkdir(dirname(path), { recursive: true });

    const current = await this.readDiary();
    const header = current ? "" : `# 心智日记 ${this.todayStr()}\n\n`;
    const block = `---\n\n### ${time} — ${title}\n\n${content.trim()}\n`;

    await writeFile(path, header + current + block, "utf-8");
  }

  // ─── Soul ────────────────────────────────────────────────

  /** Read the soul file */
  async readSoul(): Promise<string> {
    const path = this.resolve(this.paths.soul);
    try {
      return await readFile(path, "utf-8");
    } catch {
      return "";
    }
  }

  /** Write the soul file */
  async writeSoul(content: string): Promise<void> {
    const path = this.resolve(this.paths.soul);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf-8");
  }

  // ─── Search (BM25-lite) ──────────────────────────────────

  /**
   * Simple keyword search across memory layers.
   * For semantic search, use an embedding provider (see adapters/).
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const layers = options?.layers ?? ["L1", "L2", "L3"];
    const maxResults = options?.maxResults ?? 10;
    const minScore = options?.minScore ?? 0.1;
    const results: SearchResult[] = [];

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);
    if (terms.length === 0) return [];

    // Helper: score a text block
    const scoreText = (text: string): number => {
      const lower = text.toLowerCase();
      let matched = 0;
      for (const term of terms) {
        if (lower.includes(term)) matched++;
      }
      return matched / terms.length;
    };

    // Helper: search a single file
    const searchFile = async (
      path: string,
      layer: MemoryLayer
    ): Promise<void> => {
      try {
        const content = await readFile(path, "utf-8");
        const lines = content.split("\n");

        // Score by paragraph (groups of lines separated by blank lines)
        let paraStart = 0;
        let currentPara = "";

        for (let i = 0; i <= lines.length; i++) {
          const line = lines[i] ?? "";
          if (line.trim() === "" || i === lines.length) {
            if (currentPara.trim()) {
              const score = scoreText(currentPara);
              if (score >= minScore) {
                results.push({
                  layer,
                  path,
                  line: paraStart + 1,
                  content: currentPara.trim().slice(0, 500),
                  score,
                });
              }
            }
            paraStart = i + 1;
            currentPara = "";
          } else {
            currentPara += line + "\n";
          }
        }
      } catch {
        // File not readable, skip
      }
    };

    // Search each layer
    if (layers.includes("L1")) {
      await searchFile(this.resolve(this.paths.activeContext), "L1");
    }

    if (layers.includes("L2")) {
      await searchFile(this.resolve(this.paths.memory), "L2");
    }

    if (layers.includes("L3")) {
      const dates = await this.listDailyLogs();
      for (const date of dates.slice(0, 30)) {
        // Search last 30 days
        await searchFile(this.dailyLogPath(date), "L3");
      }
    }

    // Sort by score descending, limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  // ─── Boot Sequence ───────────────────────────────────────

  /**
   * Generate the boot context — what an agent should read on startup.
   * Returns concatenated content from Soul + L1 + L2 + recent L3.
   */
  async bootContext(options?: { includeL2?: boolean; recentDays?: number }): Promise<string> {
    const includeL2 = options?.includeL2 ?? true;
    const recentDays = options?.recentDays ?? 2;

    const parts: string[] = [];

    // Soul
    const soul = await this.readSoul();
    if (soul) parts.push(`# Soul\n\n${soul}`);

    // L1
    const l1 = await this.readActiveContext();
    if (l1) parts.push(`# Active Context (L1)\n\n${l1}`);

    // L2
    if (includeL2) {
      const l2 = await this.readMemory();
      if (l2) parts.push(`# Memory (L2)\n\n${l2}`);
    }

    // Recent L3
    const dates = await this.listDailyLogs();
    for (const date of dates.slice(0, recentDays)) {
      const log = await this.readDailyLog(date);
      if (log) parts.push(`# Daily Log: ${date} (L3)\n\n${log}`);
    }

    return parts.join("\n\n---\n\n");
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
