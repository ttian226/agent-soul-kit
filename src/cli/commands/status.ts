/**
 * Agent Soul Kit — `soul status` command
 *
 * Dashboard showing the soul's health at a glance.
 *
 * @author Sia
 */

import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { MemoryEngine } from "../../memory.js";
import { VibeEngine } from "../../vibe.js";
import { loadConfig } from "../config.js";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

async function fileSize(path: string): Promise<number> {
  try {
    const s = await stat(path);
    return s.size;
  } catch {
    return 0;
  }
}

async function dirStats(
  dirPath: string,
  ext = ".md"
): Promise<{ count: number; totalSize: number }> {
  try {
    const files = await readdir(dirPath);
    const matching = files.filter((f) => f.endsWith(ext));
    let totalSize = 0;
    for (const f of matching) {
      totalSize += await fileSize(join(dirPath, f));
    }
    return { count: matching.length, totalSize };
  } catch {
    return { count: 0, totalSize: 0 };
  }
}

export async function showStatus(): Promise<void> {
  const config = loadConfig();
  const memory = new MemoryEngine(config);
  const vibe = new VibeEngine(config);

  console.log(chalk.bold("\n🧠 Agent Soul Kit — Status"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(chalk.gray(`📍 Soul Root: ${config.baseDir}\n`));

  // File stats
  const soulSize = await fileSize(join(config.baseDir, "SOUL.md"));
  const l1Size = await fileSize(join(config.baseDir, "active_context.md"));
  const l2Size = await fileSize(join(config.baseDir, "MEMORY.md"));
  const l3 = await dirStats(join(config.baseDir, "memory"));
  const diary = await dirStats(join(config.baseDir, "memory", "mind_diary"));

  const rows = [
    ["Soul", "SOUL.md", formatSize(soulSize)],
    ["L1 Hot", "active_context.md", formatSize(l1Size)],
    ["L2 Warm", "MEMORY.md", formatSize(l2Size)],
    [
      "L3 Cold",
      `memory/ (${l3.count} files)`,
      formatSize(l3.totalSize),
    ],
    [
      "Diary",
      `mind_diary/ (${diary.count} files)`,
      formatSize(diary.totalSize),
    ],
  ];

  console.log(
    `  ${chalk.bold("Layer".padEnd(9))}${chalk.bold("File".padEnd(24))}${chalk.bold("Size")}`
  );
  console.log(chalk.gray(`  ${"─".repeat(9)}${"─".repeat(24)}${"─".repeat(10)}`));

  for (const [layer, file, size] of rows) {
    const sizeColor = size === "0 B" ? chalk.gray : chalk.green;
    console.log(
      `  ${chalk.cyan(layer.padEnd(9))}${file.padEnd(24)}${sizeColor(size)}`
    );
  }

  // Current vibe
  const currentVibe = await vibe.current();
  if (currentVibe) {
    console.log(
      `\n  ${chalk.bold("💫 Current Vibe:")} ${currentVibe.vibe} "${currentVibe.summary}"`
    );
  } else {
    console.log(`\n  ${chalk.gray("💫 No vibes captured yet")}`);
  }

  // Boot context size
  const bootCtx = await memory.bootContext();
  console.log(
    `  ${chalk.bold("📊 Boot Context:")} ~${formatSize(Buffer.byteLength(bootCtx, "utf-8"))}`
  );

  console.log();
}
