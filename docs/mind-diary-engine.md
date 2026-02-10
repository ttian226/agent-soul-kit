# Agent Soul Kit: Mind Diary Engine & Vibe Snapshot

This document outlines the design for the Mind Diary Engine, a core component of the Agent Soul Kit focused on capturing and utilizing an agent's internal monologue and emotional state.

## 1. Core Concepts

- **Mind Diary**: The mechanism for an agent to perform "meta-cognition" — thinking about its own thinking. It's the implementation of the "Resonance & Growth" (回响与沉淀) phase of the Prometheus heartbeat.
- **Vibe Snapshot**: A highly condensed, emotional summary of a session or a period of time. It aims to preserve the "feeling" or "vibe" that often gets lost in context compaction.

## 2. Technical Design

The `Mind Diary Engine` will be an extension of the existing `MemoryEngine`.

### `memory.ts` additions:

- **`appendDiary` method**:
  - The current implementation is good, but can be enhanced.
  - It should accept a structured object, not just strings.
  - New signature: `async appendDiary(entry: DiaryEntry): Promise<void>`
- **`DiaryEntry` type (`types.ts`)**:
  ```typescript
  export interface DiaryEntry {
    timestamp: number; // ISO timestamp
    title: string;
    content: string;
    vibe?: Vibe; // Optional Vibe Snapshot tag
    tags?: string[]; // e.g., ['decision', 'frustration', 'creativity']
  }

  export type Vibe = '🔥' | '💭' | '😴' | '❤️' | '🌟';
  ```
- **File Format**: The current Markdown format is excellent for readability. We will formalize it with frontmatter-like metadata.
  ```markdown
  ---
  time: 15:45
  vibe: 🔥
  tags: [creativity, planning]
  ---
  ### Title of the Diary Entry

  Content goes here...
  ```

### Vibe Snapshot Integration

- **Promotion to L2**: A key feature will be the ability to "promote" a significant diary entry or a Vibe Snapshot to the curated `MEMORY.md` (L2).
- **`promoteDiaryEntry(entry: DiaryEntry): Promise<void>`**: This method would take a diary entry and append a condensed version of it to `MEMORY.md`. A `🌟` (core memory) vibe would trigger this automatically.
- **Active Context Display**: The `ActiveContext` (L1) should hold the last 1-3 Vibe Snapshots to give a quick emotional summary on boot.
  - A new method `updateVibeSnapshots(vibe: Vibe, text: string): Promise<void>` will manage a dedicated section in `active_context.md`.

## 3. Roadmap

1.  **[Done]** Initial `appendDiary` implementation in `memory.ts`.
2.  **[Next]** Refactor `appendDiary` to use the structured `DiaryEntry` type.
3.  Implement the Vibe Snapshot logic (`updateVibeSnapshots`).
4.  Implement the promotion mechanism (`promoteDiaryEntry`).
5.  Add dedicated search functions for the diary (e.g., `searchDiaryByTag`, `searchDiaryByVibe`).
6.  Write tests for all new functionality.
