---
name: grd:resume-work
description: Resume work from previous session with full context restoration
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
  - SlashCommand
  - TodoRead
---

<objective>
Show current project position from STATE.md and suggest next steps. Auto-memory restores session context automatically.

Routes to the resume-project workflow which handles:
- STATE.md loading (or reconstruction if missing)
- Status presentation
- Context-aware next action suggestion
</objective>

<execution_context>
@~/.claude/get-er-done/workflows/resume-project.md
</execution_context>

<process>
**Follow the resume-project workflow** from `@~/.claude/get-er-done/workflows/resume-project.md`.
</process>
