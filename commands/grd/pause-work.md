---
name: grd:pause-work
description: Create context handoff when pausing work mid-phase
allowed-tools:
  - Read
  - Write
  - Bash
  - TodoRead
---

<objective>
Save current project position to STATE.md. Auto-memory preserves full session context.

Routes to the pause-work workflow which handles:
- Reading current STATE.md position
- Updating session timestamp
- Confirming state is preserved
</objective>

<execution_context>
@.planning/STATE.md
@~/.claude/get-er-done/workflows/pause-work.md
</execution_context>

<process>
**Follow the pause-work workflow** from `@~/.claude/get-er-done/workflows/pause-work.md`.
</process>
