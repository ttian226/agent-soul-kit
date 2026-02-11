/**
 * Agent Soul Kit — Core Types
 *
 * The three-layer memory architecture:
 * - L1 (Hot):  Active context — "Where am I right now?"
 * - L2 (Warm): Curated memory — "Who am I? What have I learned?"
 * - L3 (Cold): Raw daily logs — "What happened?"
 */

// ─── Memory Layers ───────────────────────────────────────────

export type MemoryLayer = "L1" | "L2" | "L3";

/** L1: Active context snapshot — fast, small, read every boot */
export interface ActiveContext {
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Free-form status sections (key = section title, value = markdown content) */
  sections: Record<string, string>;
}

/** L2: Curated long-term memory entry */
export interface MemoryEntry {
  /** Unique id (auto-generated) */
  id: string;
  /** When this was recorded */
  createdAt: string;
  /** When this was last updated */
  updatedAt: string;
  /** Category tag (e.g., "lesson", "person", "decision", "preference") */
  category: string;
  /** The actual content (markdown) */
  content: string;
  /** Optional importance score (0-1) for prioritization */
  importance?: number;
}

/** L3: Daily log entry */
export interface DailyLogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log content (markdown) */
  content: string;
  /** Optional tags for filtering */
  tags?: string[];
}

// ─── Soul ────────────────────────────────────────────────────

/** Soul definition — the personality seed */
export interface SoulConfig {
  /** Agent's name */
  name: string;
  /** Core identity description */
  identity: string;
  /** Personality traits */
  traits: string[];
  /** Behavioral guidelines */
  guidelines: string[];
  /** Things this agent cares about */
  interests?: string[];
  /** Custom soul file content (raw markdown, overrides structured fields) */
  raw?: string;
}

// ─── Mind Diary ──────────────────────────────────────────────

/** A single diary entry from a heartbeat/reflection cycle */
export interface DiaryEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Title of the entry */
  title: string;
  /** The actual content of the reflection */
  content: string;
  /** Optional emotional tag */
  vibe?: Vibe;
  /** Optional tags for filtering */
  tags?: string[];
}

/** A condensed, emotional summary tag */
export type Vibe = '🔥' | '💭' | '😴' | '❤️' | '🌟';

// ─── Vibe Snapshot ──────────────────────────────────────────

/** A single emotional snapshot captured at the end of a session */
export interface VibeSnapshot {
  /** ISO timestamp */
  timestamp: string;
  /** Emotional tag */
  vibe: Vibe;
  /** One-sentence summary of the emotional state */
  summary: string;
  /** Optional trigger — what caused this feeling */
  trigger?: string;
}

/** Options for reading vibes */
export interface VibeReadOptions {
  /** Maximum number of recent vibes to return (default: 5) */
  limit?: number;
  /** Filter by specific vibe type */
  filter?: Vibe;
}

// ─── Configuration ───────────────────────────────────────────

/** Root configuration for Agent Soul Kit */
export interface SoulKitConfig {
  /** Base directory for all soul files */
  baseDir: string;
  /** Agent's soul definition */
  soul: SoulConfig;
  /** Memory layer file paths (relative to baseDir) */
  paths?: {
    /** L1 active context file (default: "active_context.md") */
    activeContext?: string;
    /** L2 curated memory file (default: "MEMORY.md") */
    memory?: string;
    /** L3 daily logs directory (default: "memory/") */
    dailyLogs?: string;
    /** Mind diary directory (default: "memory/mind_diary/") */
    diary?: string;
    /** Soul file (default: "SOUL.md") */
    soul?: string;
  };
}

// ─── Search ──────────────────────────────────────────────────

/** Result from a memory search */
export interface SearchResult {
  /** Which layer this came from */
  layer: MemoryLayer;
  /** File path */
  path: string;
  /** Line number (1-indexed) */
  line?: number;
  /** The matched content snippet */
  content: string;
  /** Relevance score (0-1) */
  score: number;
}

/** Options for memory search */
export interface SearchOptions {
  /** Which layers to search (default: all) */
  layers?: MemoryLayer[];
  /** Maximum results to return */
  maxResults?: number;
  /** Minimum relevance score threshold */
  minScore?: number;
}
