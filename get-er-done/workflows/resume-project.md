<trigger>
Use this workflow when:
- Starting a new session on an existing project
- User says "continue", "what's next", "where were we", "resume"
- User returns after time away from project
</trigger>

<purpose>
Restore project context from STATE.md. Auto-memory handles detailed session continuity.
</purpose>

<process>

<step name="initialize">
Load project context:

```bash
INIT=$(node ~/.claude/get-er-done/bin/grd-tools.js init resume)
```

Parse JSON for: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`.

**If `state_exists` is false and `planning_exists` is false:** This is a new project - route to /grd:new-project
**If `state_exists` is false but `roadmap_exists` or `project_exists` is true:** Offer to reconstruct STATE.md
</step>

<step name="load_and_present">
Read STATE.md:

```bash
cat .planning/STATE.md
```

Present a concise status summary:

```
╔═══════════════════════════════════════════════════════╗
║  PROJECT STATUS                                       ║
╠═══════════════════════════════════════════════════════╣
║  Phase: [X] of [Y] - [Phase name]                    ║
║  Plan:  [A] of [B] - [Status]                        ║
║  Progress: [██████░░░░] XX%                          ║
║  Last activity: [date] - [what happened]             ║
╚═══════════════════════════════════════════════════════╝
```

Use TodoRead to check for pending deferred items. If items exist, append:

```
Pending items: [count] deferred — listed below
```

And list the items with their priorities after the status box.
</step>

<step name="suggest_next">
Based on project state, suggest the most logical next action:

**If phase ready to plan:** → `/grd:plan-phase [N]`
**If phase ready to execute:** → `/grd:execute-phase [N]`
**If phase in progress:** → `/grd:execute-phase [N]` (resume execution)
**If phase complete:** → `/grd:progress` (to transition)

For detailed status and routing: `/grd:progress`

If pending todos exist, add a note:
- "Note: [N] deferred items pending from previous work — review before starting next phase"
</step>

</process>

<success_criteria>
- [ ] STATE.md loaded and status presented
- [ ] Next action suggested based on project state
</success_criteria>
