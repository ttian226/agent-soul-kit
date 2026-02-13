/**
 * Agent Soul Kit — `soul search` command
 *
 * Search across memory layers from the command line.
 *
 * @author Sia
 */

import chalk from "chalk";
import { MemoryEngine } from "../../memory.js";
import { loadConfig } from "../config.js";
import type { MemoryLayer } from "../../types.js";

export async function searchMemory(
  query: string,
  options: { layer?: string; limit?: string }
): Promise<void> {
  const config = loadConfig();
  const engine = new MemoryEngine(config);

  const layers = options.layer
    ? (options.layer.split(",").map((l) => l.trim().toUpperCase()) as MemoryLayer[])
    : undefined;
  const maxResults = options.limit ? parseInt(options.limit, 10) : 10;

  console.log(chalk.blue(`\n🔍 Searching for "${chalk.bold(query)}"...\n`));

  const results = await engine.search(query, { layers, maxResults });

  if (results.length === 0) {
    console.log(chalk.yellow("  No results found.\n"));
    return;
  }

  console.log(
    `  ${chalk.bold("Score".padEnd(7))}${chalk.bold("Layer".padEnd(6))}${chalk.bold("Content")}`
  );
  console.log(chalk.gray(`  ${"─".repeat(7)}${"─".repeat(6)}${"─".repeat(50)}`));

  for (const r of results) {
    const score = r.score.toFixed(2).padEnd(7);
    const layer = r.layer.padEnd(6);
    const content = r.content.replace(/\n/g, " ").slice(0, 60);

    const layerColor =
      r.layer === "L1" ? chalk.red : r.layer === "L2" ? chalk.yellow : chalk.cyan;

    console.log(`  ${chalk.green(score)}${layerColor(layer)}${content}`);
  }

  console.log(chalk.gray(`\n  ${results.length} result(s) found.\n`));
}
