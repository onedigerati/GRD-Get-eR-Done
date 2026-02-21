# State Template

Template for `.planning/STATE.md` â€” the project's living memory.

---

## File Template

```markdown
# Project State

## Project Reference

See: .planning/PROJECT.md (updated [date])

**Core value:** [One-liner from PROJECT.md Core Value section]
**Current focus:** [Current phase name]

## Current Position

Phase: [X] of [Y] ([Phase name])
Plan: [A] of [B] in current phase
Status: [Ready to plan / Planning / Ready to execute / In progress / Phase complete]
Last activity: [YYYY-MM-DD] â€” [What happened]

Progress: [â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: [N]
- Average duration: [X] min
- Total execution time: [X.X] hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: [durations]
- Trend: [Improving / Stable / Degrading]

*Updated after each plan completion*

## Session Continuity

Last activity: [YYYY-MM-DD HH:MM]
```

<purpose>

STATE.md is the project's short-term memory spanning all phases and sessions.

**Problem it solves:** Information is captured in summaries, issues, and decisions but not systematically consumed. Sessions start without context.

**Solution:** A single, small file that's:
- Read first in every workflow
- Updated after every significant action
- Enables instant session restoration

</purpose>

<lifecycle>

**Creation:** After ROADMAP.md is created (during init)
- Reference PROJECT.md (read it for current context)
- Set position to "Phase 1 ready to plan"

**Reading:** First step of every workflow
- progress: Present status to user
- plan: Inform planning decisions
- execute: Know current position
- transition: Know what's complete

**Writing:** After every significant action
- execute: After SUMMARY.md created
  - Update position (phase, plan, status)
- transition: After phase marked complete
  - Update progress bar
  - Refresh Project Reference date

</lifecycle>

<sections>

### Project Reference
Points to PROJECT.md for full context. Includes:
- Core value (the ONE thing that matters)
- Current focus (which phase)
- Last update date (triggers re-read if stale)

Claude reads PROJECT.md directly for requirements, constraints, and decisions.

### Current Position
Where we are right now:
- Phase X of Y â€” which phase
- Plan A of B â€” which plan within phase
- Status â€” current state
- Last activity â€” what happened most recently
- Progress bar â€” visual indicator of overall completion

Progress calculation: (completed plans) / (total plans across all phases) Ã— 100%

### Performance Metrics
Track velocity to understand execution patterns:
- Total plans completed
- Average duration per plan
- Per-phase breakdown
- Recent trend (improving/stable/degrading)

Updated after each plan completion.

### Session Continuity
Last activity timestamp. Auto-memory handles detailed session context.

</sections>

<size_constraint>

Keep STATE.md under 50 lines.

It's a DIGEST, not an archive. The goal is "read once, know where we are" — if it's too long, that fails.

</size_constraint>
