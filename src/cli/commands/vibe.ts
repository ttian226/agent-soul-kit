/**
 * Agent Soul Kit — `soul vibe` command
 *
 * Capture, view, and analyze emotional snapshots.
 *
 * @author Sia
 */

import chalk from "chalk";
import { VibeEngine } from "../../vibe.js";
import { loadConfig } from "../config.js";
import type { Vibe } from "../../types.js";

const VALID_VIBES: Vibe[] = ["🔥", "💭", "😴", "❤️", "🌟"];

const VIBE_LABELS: Record<Vibe, string> = {
  "🔥": "energetic",
  "💭": "reflective",
  "😴": "calm",
  "❤️": "warm",
  "🌟": "inspired",
};

export async function showVibes(): Promise<void> {
  const config = loadConfig();
  const engine = new VibeEngine(config);

  const current = await engine.current();
  const recent = await engine.readRecent({ limit: 5 });

  console.log(chalk.bold("\n💫 Vibe History"));
  console.log(chalk.gray("─".repeat(40)));

  if (recent.length === 0) {
    console.log(chalk.gray("  No vibes captured yet."));
    console.log(
      chalk.gray('  Use `soul vibe capture <emoji> "<summary>"` to add one.\n')
    );
    return;
  }

  for (const v of recent) {
    const time = v.timestamp.slice(0, 16).replace("T", " ");
    const isCurrent = v === current;
    const prefix = isCurrent ? chalk.bold("→") : " ";
    const label = VIBE_LABELS[v.vibe] ?? "";
    const trigger = v.trigger ? chalk.gray(` (${v.trigger})`) : "";
    console.log(
      `  ${prefix} ${v.vibe} ${chalk.gray(`[${time}]`)} ${v.summary}${trigger} ${chalk.gray(label)}`
    );
  }

  console.log();
}

export async function captureVibe(
  emoji: string,
  summary: string,
  options: { trigger?: string }
): Promise<void> {
  if (!VALID_VIBES.includes(emoji as Vibe)) {
    console.log(
      chalk.red(
        `\n❌ Invalid vibe: "${emoji}". Must be one of: ${VALID_VIBES.join(" ")}\n`
      )
    );
    process.exit(1);
  }

  const config = loadConfig();
  const engine = new VibeEngine(config);

  await engine.capture({
    timestamp: new Date().toISOString(),
    vibe: emoji as Vibe,
    summary,
    trigger: options.trigger,
  });

  console.log(chalk.green(`\n✅ Vibe captured: ${emoji} "${summary}"\n`));
}

export async function showResonance(): Promise<void> {
  const config = loadConfig();
  const engine = new VibeEngine(config);

  const tone = await engine.resonance();
  console.log(chalk.bold("\n🎵 Emotional Resonance"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(`  ${tone}`);
  console.log();
}
