<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean â€” delegates plan execution to subagents.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans â†' analyze deps â†' group waves â†' create team â†' spawn agents as team members â†' track via shared tasks â†' handle checkpoints â†' collect results â†' tear down team.
</core_principle>

<agent_teams_model>
## Agent Teams Coordination

Phase execution uses Claude Code's **Agent Teams** for persistent, coordinated multi-agent orchestration:

1. **TeamCreate** â€" A team named `grd-phase-{N}-execution` is created at the start of the phase. This provides a shared task list and messaging bus for all executor agents in the phase.

2. **TaskCreate** â€" Each plan from PLAN.md is registered as a shared task in the team's task list. This gives every agent visibility into what's being worked on, what's pending, and what's done.

3. **Team Members** â€" Executor agents are spawned with `team_name="grd-phase-{N}-execution"` so they join the team. They can see the shared task list, claim tasks, and report completion via TaskUpdate.

4. **TaskUpdate** â€" As executors complete plans, they mark their task `completed`. The orchestrator monitors via TaskList to know when a wave is done.

5. **SendMessage** â€" Executors use DMs to the orchestrator when they hit blockers, and the orchestrator uses targeted messages to wake agents or relay checkpoint decisions. Broadcasts are reserved for critical cross-wave announcements only.

6. **TeamDelete** â€" When the phase completes (or is aborted), the team is deleted to clean up resources.

**Why teams over raw Task spawning:**
- Shared visibility: all agents see the full plan inventory, not just their own plan
- Structured progress: TaskList replaces ad-hoc polling or output parsing
- Inter-agent coordination: executors can message each other about shared file conflicts
- Clean lifecycle: team creation and deletion bracket the phase cleanly
</agent_teams_model>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<process>

<step name="initialize" priority="first">
Load all context in one call:

```bash
INIT=$(node ~/.claude/get-er-done/bin/grd-tools.js init execute-phase "${PHASE_ARG}")
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`.

**If `phase_found` is false:** Error â€” phase directory not found.
**If `plan_count` is 0:** Error â€” no plans found in phase.
**If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.

When `parallelization` is false, plans within a wave execute sequentially.

**Create the execution team:**

```
TeamCreate(name="grd-phase-{phase_number}-execution")
```

Display team creation announcement:
```
â—† Assembling team: grd-phase-{phase_number}-execution â€" {incomplete_count} executor(s) across {wave_count} wave(s)
```

This team persists for the entire phase execution. All executor agents join it as members.
</step>

<step name="handle_branching">
Check `branching_strategy` from init:

**"none":** Skip, continue on current branch.

**"phase" or "milestone":** Use pre-computed `branch_name` from init:
```bash
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

All subsequent commits go to this branch. User handles merging.
</step>

<step name="validate_phase">
From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.

Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
</step>

<step name="discover_and_group_plans">
Load plan inventory with wave grouping in one call:

```bash
PLAN_INDEX=$(node ~/.claude/get-er-done/bin/grd-tools.js phase-plan-index "${PHASE_NUMBER}")
```

Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number â†’ plan IDs), `incomplete`, `has_checkpoints`.

**Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If all filtered: "No matching incomplete plans" â†’ exit.

Report:
```
## Execution Plan

**Phase {X}: {Name}** â€" {total_plans} plans across {wave_count} waves

| Wave | Plans | What it builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
| 2 | 01-03 | ... |
```

**Register plans as shared team tasks:**

For each incomplete plan, create a task in the team's shared task list:

```
TaskCreate(
  subject="Execute plan {plan_id}: {plan_objective}",
  description="Phase {phase_number}, Wave {wave_number}. Plan file: {phase_dir}/{plan_file}. Objective: {objective}.",
  activeForm="Executing plan {plan_id}"
)
```

Set up wave dependencies â€" plans in Wave 2 are blocked by Wave 1 plans:

```
TaskUpdate(taskId="{wave2_task}", addBlockedBy=["{wave1_task_ids}"])
```

This gives all agents a single view of what's planned, in progress, and done.
</step>

<step name="execute_waves">
Execute each wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   Read each plan's `<objective>` and `files_modified`. Extract what's being built and why.

   ```
   ---
   ## Wave {N}

   | # | Plan | Objective | Key Files |
   |---|------|-----------|-----------|
   | 1 | {Plan ID}: {Plan Name} | {one-line objective from plan} | {top 2-3 files_modified} |
   | 2 | {Plan ID}: {Plan Name} | {one-line objective} | {top 2-3 files_modified} |

   {2-3 sentences: what this wave builds collectively, why it matters, what it enables for subsequent waves}

   Spawning {count} executor(s)...
   ---
   ```

   - Bad: "Executing terrain generation plan"
   - Good table + summary: Table shows each plan's objective and files, followed by "Procedural terrain generator using Perlin noise â€" creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."

2. **Spawn executor agents as team members:**

   Pass paths only â€" executors read files themselves with their fresh 200k context.
   This keeps orchestrator context lean (~10-15%).

   Before spawning, mark the plan's shared task as in_progress:
   ```
   TaskUpdate(taskId="{plan_task_id}", status="in_progress")
   ```

   ```
   Task(
     subagent_type="grd-executor",
     model="{executor_model}",
     team_name="grd-phase-{phase_number}-execution",
     prompt="
       <objective>
       Execute plan {plan_number} of phase {phase_number}-{phase_name}.
       Commit each task atomically. Create SUMMARY.md. Update STATE.md.
       </objective>

       <team_context>
       You are a member of team 'grd-phase-{phase_number}-execution'.
       Your task ID in the shared task list: {plan_task_id}
       - Use TaskUpdate to mark your task 'completed' when done
       - Use SendMessage to DM the orchestrator if you hit a blocker
       - Use SendMessage to DM other executors if you need to coordinate on shared files
       - Check TaskList to see overall phase progress
       </team_context>

       <execution_context>
       @~/.claude/get-er-done/workflows/execute-plan.md
       @~/.claude/get-er-done/templates/summary.md
       @~/.claude/get-er-done/references/checkpoints.md
       @~/.claude/get-er-done/references/tdd.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - Plan: {phase_dir}/{plan_file}
       - State: .planning/STATE.md
       - Config: .planning/config.json (if exists)
       </files_to_read>

       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created in plan directory
       - [ ] STATE.md updated with position and decisions
       - [ ] Shared team task marked completed via TaskUpdate
       </success_criteria>
     "
   )
   ```

3. **Wait for all agents in wave to complete.**

   Monitor wave completion via the shared task list:
   ```
   TaskList()  # Check status of all wave tasks
   ```
   All tasks for the current wave should show `completed` before proceeding. If an agent goes idle without completing, use SendMessage to wake it.

4. **Report completion â€” spot-check claims first:**

   For each SUMMARY.md:
   - Verify first 2 files from `key-files.created` exist on disk
   - Check `git log --oneline --all --grep="{phase}-{plan}"` returns â‰¥1 commit
   - Check for `## Self-Check: FAILED` marker

   If ANY spot-check fails: report which plan failed, route to failure handler â€” ask "Retry plan?" or "Continue with remaining waves?"

   If pass:
   ```
   ---
   ## Wave {N} Complete

   **{Plan ID}: {Plan Name}**
   {What was built â€” from SUMMARY.md}
   {Notable deviations, if any}

   {If more waves: what this enables for next wave}
   ---
   ```

   - Bad: "Wave 2 complete. Proceeding to Wave 3."
   - Good: "Terrain system complete â€” 3 biome types, height-based texturing, physics collision meshes. Vehicle physics (Wave 3) can now reference ground surfaces."

5. **Handle failures:**

   **Known Claude Code bug (classifyHandoffIfNeeded):** If an agent reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug â€” not a GRD or agent issue. The error fires in the completion handler AFTER all tool calls finish. In this case: run the same spot-checks as step 4 (SUMMARY.md exists, git commits present, no Self-Check: FAILED). If spot-checks PASS â†’ treat as **successful**. If spot-checks FAIL â†’ treat as real failure below.

   For real failures: report which plan failed â†’ ask "Continue?" or "Stop?" â†’ if continue, dependent plans may also fail. If stop, partial completion report.

6. **Execute checkpoint plans between waves** â€” see `<checkpoint_handling>`.

7. **Proceed to next wave.**
</step>

<step name="checkpoint_handling">
Plans with `autonomous: false` require user interaction.

**Flow:**

1. Spawn agent for checkpoint plan
2. Agent runs until checkpoint task or auth gate â†’ returns structured state
3. Agent return includes: completed tasks table, current task + blocker, checkpoint type/details, what's awaited
4. **Present to user:**
   ```
   ## Checkpoint: [Type]

   **Plan:** 03-03 Dashboard Layout
   **Progress:** 2/3 tasks complete

   [Checkpoint Details from agent return]
   [Awaiting section from agent return]
   ```
5. User responds: "approved"/"done" | issue description | decision selection
6. **Spawn continuation agent (NOT resume)** using continuation-prompt.md template:
   - `{completed_tasks_table}`: From checkpoint return
   - `{resume_task_number}` + `{resume_task_name}`: Current task
   - `{user_response}`: What user provided
   - `{resume_instructions}`: Based on checkpoint type
7. Continuation agent verifies previous commits, continues from resume point
8. Repeat until plan completes or user stops

**Why fresh agent, not resume:** Resume relies on internal serialization that breaks with parallel tool calls. Fresh agents with explicit state are more reliable.

**Checkpoints in parallel waves:** Agent pauses and returns while other parallel agents may complete. Present checkpoint, spawn continuation, wait for all before next wave.
</step>

<step name="teardown_team">
After all waves complete (or on abort), clean up the execution team:

```
TeamDelete(name="grd-phase-{phase_number}-execution")
```

This releases all team resources. Proceed to aggregate_results.
</step>

<step name="aggregate_results">
After all waves:

```markdown
## Phase {X}: {Name} Execution Complete

**Waves:** {N} | **Plans:** {M}/{total} complete

| Wave | Plans | Status |
|------|-------|--------|
| 1 | plan-01, plan-02 | âœ“ Complete |
| CP | plan-03 | âœ“ Verified |
| 2 | plan-04 | âœ“ Complete |

### Plan Details
1. **03-01**: [one-liner from SUMMARY.md]
2. **03-02**: [one-liner from SUMMARY.md]

### Issues Encountered
[Aggregate from SUMMARYs, or "None"]
```
</step>

<step name="verify_phase_goal">
Verify phase achieved its GOAL, not just completed tasks.

```
Task(
  prompt="Verify phase {phase_number} goal achievement.
Phase directory: {phase_dir}
Phase goal: {goal from ROADMAP.md}
Check must_haves against actual codebase. Create VERIFICATION.md.",
  subagent_type="grd-verifier",
  model="{verifier_model}"
)
```

Read status:
```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Action |
|--------|--------|
| `passed` | â†’ update_roadmap |
| `human_needed` | Present items for human testing, get approval or feedback |
| `gaps_found` | Present gap summary, offer `/grd:plan-phase {phase} --gaps` |

**If human_needed:**
```
## âœ“ Phase {X}: {Name} â€” Human Verification Required

All automated checks passed. {N} items need human testing:

{From VERIFICATION.md human_verification section}

"approved" â†’ continue | Report issues â†’ gap closure
```

**If gaps_found:**
```
## âš  Phase {X}: {Name} â€” Gaps Found

**Score:** {N}/{M} must-haves verified
**Report:** {phase_dir}/{phase}-VERIFICATION.md

### What's Missing
{Gap summaries from VERIFICATION.md}

---
## â–¶ Next Up

`/grd:plan-phase {X} --gaps`

<sub>`/clear` first â†’ fresh context window</sub>

Also: `cat {phase_dir}/{phase}-VERIFICATION.md` â€” full report
Also: `/grd:verify-work {X}` â€” manual testing first
```

Gap closure cycle: `/grd:plan-phase {X} --gaps` reads VERIFICATION.md â†’ creates gap plans with `gap_closure: true` â†’ user runs `/grd:execute-phase {X} --gaps-only` â†’ verifier re-runs.
</step>

<step name="update_roadmap">
Mark phase complete in ROADMAP.md (date, status).

```bash
node ~/.claude/get-er-done/bin/grd-tools.js commit "docs(phase-{X}): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/phases/{phase_dir}/*-VERIFICATION.md .planning/REQUIREMENTS.md
```
</step>

<step name="offer_next">

**If more phases:**
```
## Next Up

**Phase {X+1}: {Name}** â€” {Goal}

`/grd:plan-phase {X+1}`

<sub>`/clear` first for fresh context</sub>
```

**If milestone complete:**
```
MILESTONE COMPLETE!

All {N} phases executed.

`/grd:complete-milestone`
```
</step>

</process>

<context_efficiency>
Orchestrator: ~10-15% context. Subagents: fresh 200k each. No polling â€" TaskList provides structured progress. No context bleed. Agent Teams provides shared task visibility and inter-agent messaging without routing through the orchestrator.
</context_efficiency>

<failure_handling>
- **classifyHandoffIfNeeded false failure:** Agent reports "failed" but error is `classifyHandoffIfNeeded is not defined` â†’ Claude Code bug, not GRD. Spot-check (SUMMARY exists, commits present) â†’ if pass, treat as success
- **Agent fails mid-plan:** Missing SUMMARY.md â†’ report, ask user how to proceed
- **Dependency chain breaks:** Wave 1 fails â†’ Wave 2 dependents likely fail â†’ user chooses attempt or skip
- **All agents in wave fail:** Systemic issue â†’ stop, report for investigation
- **Checkpoint unresolvable:** "Skip this plan?" or "Abort phase execution?" â†’ record partial progress in STATE.md
</failure_handling>

<resumption>
Re-run `/grd:execute-phase {phase}` â†' discover_plans finds completed SUMMARYs â†' skips them â†' creates fresh team `grd-phase-{N}-execution` â†' registers only incomplete plans as tasks â†' resumes from first incomplete wave.

STATE.md tracks: last completed plan, current wave, pending checkpoints. A new team is created on each resumption (previous team was torn down or expired).
</resumption>
