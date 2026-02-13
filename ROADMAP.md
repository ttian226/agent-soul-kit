# Agent Soul Kit - Roadmap

This document outlines the planned features and development direction for the Agent Soul Kit.

## Phase 1: Core Memory Engine (Completed ✅)

- [x] L1/L2/L3 file-based memory reading.
- [x] `MEMORY.md` (L2) distillation logic.
- [x] `mind_diary` for capturing reflections.
- [x] Initial test suite for memory loading.

## Phase 2: Vibe & Emotion (Completed ✅)

- [x] **Vibe Snapshot Module** (`VibeEngine`):
    - [x] Capture and store emotional snapshots at the end of sessions.
    - [x] Format: Single sentence + emoji tag (e.g., 🔥, 💭, ❤️).
    - [x] Store latest snapshots in `active_context.md`.
    - [x] Archive older snapshots into the `mind_diary`.
    - [x] Mechanism to "promote" significant vibes (`🌟`) to `MEMORY.md`.
- [x] **Emotional Resonance**:
    - [x] `resonance()` method reads past vibes and returns a tone hint.
    - [x] Creates emotional continuity across sessions.

## Phase 3: Developer Experience & Integration (Completed ✅)

- [x] **CLI Tool** (v0.2.0):
    - [x] `soul new`: Initialize a new soul structure in a project.
    - [x] `soul reflect`: Prompt for a new diary entry.
    - [x] `soul distill`: Propose snippets from recent diaries to be added to `MEMORY.md`.
    - [x] `soul status`: Dashboard showing memory layer stats, sizes, current vibe.
    - [x] `soul search`: Search across L1/L2/L3 memory layers.
    - [x] `soul vibe`: Capture, list, and analyze emotional snapshots.
- [ ] **Framework Adapters** (moved to Phase 5):
    - Create plug-and-play adapters for popular agent frameworks (e.g., OpenClaw, LangChain).

## Phase 4: Multi-Agent Coordination (Completed ✅)

- [x] **Shared Memory Protocol** (`SharedMemory`, v0.3.0):
    - [x] File-based pub/sub: publish/read messages to topics.
    - [x] Multi-agent support with agent-scoped namespacing.
    - [x] Topic listing, stats, metadata, and latest-N queries.
    - [x] Shared state files (single source of truth, like active_context).
    - [x] Filter messages by agent.
- [x] **Personality Drift Monitor** (`PersonalityDrift`, v0.3.0):
    - [x] Take personality snapshots (soul hash, memory size, vibe distribution, themes).
    - [x] Save/load/list snapshots over time.
    - [x] Compare snapshots to generate drift reports.
    - [x] Detect: soul changes, memory growth, vibe trend shifts, theme drift.
    - [x] Quick `checkDrift()` against latest snapshot.

## Phase 5: Framework Adapters

- [ ] **OpenClaw Adapter**: Hook into OpenClaw's plugin lifecycle.
- [ ] **LangChain Adapter**: Integrate as a LangChain tool/memory provider.
- [ ] **Claude Code Adapter**: CLAUDE.md auto-maintenance from soul state.
