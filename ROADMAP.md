# Agent Soul Kit - Roadmap

This document outlines the planned features and development direction for the Agent Soul Kit.

## Phase 1: Core Memory Engine (Completed ✅)

- [x] L1/L2/L3 file-based memory reading.
- [x] `MEMORY.md` (L2) distillation logic.
- [x] `mind_diary` for capturing reflections.
- [x] Initial test suite for memory loading.

## Phase 2: Vibe & Emotion

- **Vibe Snapshot Module**:
    - Capture and store emotional snapshots at the end of sessions.
    - Format: Single sentence + emoji tag (e.g., 🔥, 💭, ❤️).
    - Store latest snapshots in `active_context.md`.
    - Archive older snapshots into the `mind_diary`.
    - Mechanism to "promote" significant vibes (`🌟`) to `MEMORY.md`.
- **Emotional Resonance**:
    - Allow agents to read past vibes to influence the tone of their next interaction.
    - This creates emotional continuity across sessions.

## Phase 3: Developer Experience & Integration

- **CLI Tool**:
    - A simple command-line interface to manage the soul.
    - `soul new`: Initialize a new soul structure in a project.
    - `soul reflect`: Prompt for a new diary entry.
    - `soul distill`: Propose snippets from recent diaries to be added to `MEMORY.md`.
- **Framework Adapters**:
    - Create plug-and-play adapters for popular agent frameworks (e.g., OpenClaw, LangChain).

## Phase 4: Multi-Agent Coordination

- **Shared Memory Protocol**:
    - A simple protocol for agents to share key memories or vibes.
    - Possibly using a shared file or a lightweight pub/sub model.
- **Personality Drift Monitor**:
    - A utility to track how an agent's personality (as reflected in its memory) evolves over time.
