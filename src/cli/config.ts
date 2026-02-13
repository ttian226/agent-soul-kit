/**
 * Agent Soul Kit — CLI Config Loader
 *
 * Shared helper to resolve soul root and create engine configs.
 *
 * @author Sia
 */

import path from "path";
import type { SoulKitConfig } from "../types.js";

/**
 * Load a SoulKitConfig from a directory.
 * Uses sensible defaults matching MemoryEngine/VibeEngine.
 */
export function loadConfig(dir?: string): SoulKitConfig {
  const baseDir = path.resolve(dir ?? ".");

  return {
    baseDir,
    soul: {
      name: "Agent",
      identity: "",
      traits: [],
      guidelines: [],
    },
  };
}
