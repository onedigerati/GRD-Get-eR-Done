<purpose>
Display the complete GRD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

<reference>
# GRD command Reference

**GRD** (Get eR Done) creates hierarchical project plans optimized for solo agentic development with Claude Code.

## Quick Start

1. `/grd:new-project` - Initialize project (includes research, requirements, roadmap)
2. `/grd:plan-phase 1` - Create detailed plan for first phase
3. `/grd:execute-phase 1` - Execute the phase

## Staying Updated

GRD evolves fast. Update periodically:

```bash
npx get-er-done-cc@latest
```

## Core Workflow

```
/grd:new-project â†’ /grd:plan-phase â†’ /grd:execute-phase â†’ repeat
```

### Project Initialization

**`/grd:new-project`**
Initialize new project through unified flow.

One command takes you from idea to ready-for-planning:
- Deep questioning to understand what you're building
- Optional domain research (spawns Agent Team `grd-project-research` with 4 parallel researchers)
- Requirements definition with v1/v2/out-of-scope scoping
- Roadmap creation with phase breakdown and success criteria

Creates all `.planning/` artifacts:
- `PROJECT.md` â€” vision and requirements
- `config.json` â€” workflow mode (interactive/yolo)
- `research/` â€” domain research (if selected)
- `REQUIREMENTS.md` â€” scoped requirements with REQ-IDs
- `ROADMAP.md` â€” phases mapped to requirements
- `STATE.md` â€” project memory

Usage: `/grd:new-project`

**`/grd:map-codebase`**
Map an existing codebase for brownfield projects.

- Creates Agent Team `grd-codebase-mapping` with 4 mapper agents
- Analyzes codebase in parallel across focus areas
- Creates `.planning/codebase/` with 7 focused documents
- Covers stack, architecture, structure, conventions, testing, integrations, concerns
- Use before `/grd:new-project` on existing codebases

Usage: `/grd:map-codebase`

### Phase Planning

**`/grd:discuss-phase <number>`**
Help articulate your vision for a phase before planning.

- Captures how you imagine this phase working
- Creates CONTEXT.md with your vision, essentials, and boundaries
- Use when you have ideas about how something should look/feel

Usage: `/grd:discuss-phase 2`

**`/grd:research-phase <number>`**
Comprehensive ecosystem research for niche/complex domains.

- Discovers standard stack, architecture patterns, pitfalls
- Creates RESEARCH.md with "how experts build this" knowledge
- Use for 3D, games, audio, shaders, ML, and other specialized domains
- Goes beyond "which library" to ecosystem knowledge

Usage: `/grd:research-phase 3`

**`/grd:list-phase-assumptions <number>`**
See what Claude is planning to do before it starts.

- Shows Claude's intended approach for a phase
- Lets you course-correct if Claude misunderstood your vision
- No files created - conversational output only

Usage: `/grd:list-phase-assumptions 3`

**`/grd:plan-phase <number>`**
Create detailed execution plan for a specific phase.

- Generates `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
- Breaks phase into concrete, actionable tasks
- Includes verification criteria and success measures
- Multiple plans per phase supported (XX-01, XX-02, etc.)

Usage: `/grd:plan-phase 1`
Result: Creates `.planning/phases/01-foundation/01-01-PLAN.md`

### Execution

**`/grd:execute-phase <phase-number>`**
Execute all plans in a phase.

- Creates Agent Team `grd-phase-{N}-execution` for coordinated execution
- Groups plans by wave (from frontmatter), executes waves sequentially
- Plans within each wave run in parallel as team members
- Shared task list tracks progress across all executors
- Verifies phase goal after all plans complete
- Updates REQUIREMENTS.md, ROADMAP.md, STATE.md

Usage: `/grd:execute-phase 5`

### Quick Mode

**`/grd:quick`**
Execute small, ad-hoc tasks with GRD guarantees but skip optional agents.

Quick mode uses the same system with a shorter path:
- Spawns planner + executor (skips researcher, checker, verifier)
- Quick tasks live in `.planning/quick/` separate from planned phases
- Updates STATE.md tracking (not ROADMAP.md)

Use when you know exactly what to do and the task is small enough to not need research or verification.

Usage: `/grd:quick`
Result: Creates `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/SUMMARY.md`

### Roadmap Management

**`/grd:add-phase <description>`**
Add new phase to end of current milestone.

- Appends to ROADMAP.md
- Uses next sequential number
- Updates phase directory structure

Usage: `/grd:add-phase "Add admin dashboard"`

**`/grd:insert-phase <after> <description>`**
Insert urgent work as decimal phase between existing phases.

- Creates intermediate phase (e.g., 7.1 between 7 and 8)
- Useful for discovered work that must happen mid-milestone
- Maintains phase ordering

Usage: `/grd:insert-phase 7 "Fix critical auth bug"`
Result: Creates Phase 7.1

**`/grd:remove-phase <number>`**
Remove a future phase and renumber subsequent phases.

- Deletes phase directory and all references
- Renumbers all subsequent phases to close the gap
- Only works on future (unstarted) phases
- Git commit preserves historical record

Usage: `/grd:remove-phase 17`
Result: Phase 17 deleted, phases 18-20 become 17-19

### Milestone Management

**`/grd:new-milestone <name>`**
Start a new milestone through unified flow.

- Deep questioning to understand what you're building next
- Optional domain research (spawns 4 parallel researcher agents)
- Requirements definition with scoping
- Roadmap creation with phase breakdown

Mirrors `/grd:new-project` flow for brownfield projects (existing PROJECT.md).

Usage: `/grd:new-milestone "v2.0 Features"`

**`/grd:complete-milestone <version>`**
Archive completed milestone and prepare for next version.

- Creates MILESTONES.md entry with stats
- Archives full details to milestones/ directory
- Creates git tag for the release
- Prepares workspace for next version

Usage: `/grd:complete-milestone 1.0.0`

### Progress Tracking

**`/grd:progress`**
Check project status and intelligently route to next action.

- Shows visual progress bar and completion percentage
- Summarizes recent work from SUMMARY files
- Displays current position and what's next
- Lists key decisions and open issues
- Offers to execute next plan or create it if missing
- Detects 100% milestone completion

Usage: `/grd:progress`

### Session Management

**`/grd:resume-work`**
Resume work from previous session.

- Shows current position from STATE.md
- Surfaces pending deferred items via TodoRead
- Suggests next action based on project state
- Auto-memory restores detailed session context

Usage: `/grd:resume-work`

**`/grd:pause-work`**
Save current position when pausing work.

- Updates STATE.md session timestamp
- Surfaces pending items count for awareness
- Auto-memory preserves full session context including key decisions

Usage: `/grd:pause-work`

### Deferred Work Tracking

GRD uses Claude Code's native `TodoRead`/`TodoWrite` tools to track deferred decisions, discovered work, and cross-phase items:

- **During execution:** The executor captures deferred architectural decisions and out-of-scope improvements as todos
- **On pause:** Pending items are surfaced before saving state
- **On resume:** Pending items are displayed alongside project status
- **At transitions:** Carry-forward items are checked at phase boundaries
- **In progress:** Pending items appear in the progress report

No commands needed — tracking happens automatically within existing GRD workflows.

### Debugging

**`/grd:debug [issue description]`**
Systematic debugging with persistent state across context resets.

- Gathers symptoms through adaptive questioning
- Creates `.planning/debug/[slug].md` to track investigation
- Investigates using scientific method (evidence â†’ hypothesis â†’ test)
- Survives `/clear` â€” run `/grd:debug` with no args to resume
- Archives resolved issues to `.planning/debug/resolved/`

Usage: `/grd:debug "login button doesn't work"`
Usage: `/grd:debug` (resume active session)

### User Acceptance Testing

**`/grd:verify-work [phase]`**
Validate built features through conversational UAT.

- Extracts testable deliverables from SUMMARY.md files
- Presents tests one at a time (yes/no responses)
- Automatically diagnoses failures and creates fix plans
- Ready for re-execution if issues found

Usage: `/grd:verify-work 3`

### Milestone Auditing

**`/grd:audit-milestone [version]`**
Audit milestone completion against original intent.

- Reads all phase VERIFICATION.md files
- Checks requirements coverage
- Spawns integration checker for cross-phase wiring
- Creates MILESTONE-AUDIT.md with gaps and tech debt

Usage: `/grd:audit-milestone`

**`/grd:plan-milestone-gaps`**
Create phases to close gaps identified by audit.

- Reads MILESTONE-AUDIT.md and groups gaps into phases
- Prioritizes by requirement priority (must/should/nice)
- Adds gap closure phases to ROADMAP.md
- Ready for `/grd:plan-phase` on new phases

Usage: `/grd:plan-milestone-gaps`

### Configuration

**`/grd:settings`**
Configure workflow toggles interactively.

- Toggle researcher, plan checker, verifier agents
- Select git branching strategy
- Updates `.planning/config.json`

Usage: `/grd:settings`

### Utility Commands

**`/grd:help`**
Show this command reference.

**`/grd:update`**
Update GRD to latest version with changelog preview.

- Shows installed vs latest version comparison
- Displays changelog entries for versions you've missed
- Highlights breaking changes
- Confirms before running install
- Better than raw `npx get-er-done-cc`

Usage: `/grd:update`

**`/grd:join-discord`**
Join the GRD Discord community.

- Get help, share what you're building, stay updated
- Connect with other GRD users

Usage: `/grd:join-discord`

## Files & Structure

```
.planning/
â”œâ”€â”€ PROJECT.md            # Project vision
â”œâ”€â”€ ROADMAP.md            # Current phase breakdown
â”œâ”€â”€ STATE.md              # Project memory & context
â”œâ”€â”€ config.json           # Workflow mode & gates
â”œâ”€â”€ debug/                # Active debug sessions
â”‚   â””â”€â”€ resolved/         # Archived resolved issues
â”œâ”€â”€ codebase/             # Codebase map (brownfield projects)
â”‚   â”œâ”€â”€ STACK.md          # Languages, frameworks, dependencies
â”‚   â”œâ”€â”€ ARCHITECTURE.md   # Patterns, layers, data flow
â”‚   â”œâ”€â”€ STRUCTURE.md      # Directory layout, key files
â”‚   â”œâ”€â”€ CONVENTIONS.md    # Coding standards, naming
â”‚   â”œâ”€â”€ TESTING.md        # Test setup, patterns
â”‚   â”œâ”€â”€ INTEGRATIONS.md   # External services, APIs
â”‚   â””â”€â”€ CONCERNS.md       # Tech debt, known issues
â””â”€â”€ phases/
    â”œâ”€â”€ 01-foundation/
    â”‚   â”œâ”€â”€ 01-01-PLAN.md
    â”‚   â””â”€â”€ 01-01-SUMMARY.md
    â””â”€â”€ 02-core-features/
        â”œâ”€â”€ 02-01-PLAN.md
        â””â”€â”€ 02-01-SUMMARY.md
```

## Workflow Modes

Set during `/grd:new-project`:

**Interactive Mode**

- Confirms each major decision
- Pauses at checkpoints for approval
- More guidance throughout

**YOLO Mode**

- Auto-approves most decisions
- Executes plans without confirmation
- Only stops for critical checkpoints

Change anytime by editing `.planning/config.json`

## Planning Configuration

Configure how planning artifacts are managed in `.planning/config.json`:

**`planning.commit_docs`** (default: `true`)
- `true`: Planning artifacts committed to git (standard workflow)
- `false`: Planning artifacts kept local-only, not committed

When `commit_docs: false`:
- Add `.planning/` to your `.gitignore`
- Useful for OSS contributions, client projects, or keeping planning private
- All planning files still work normally, just not tracked in git

**`planning.search_gitignored`** (default: `false`)
- `true`: Add `--no-ignore` to broad ripgrep searches
- Only needed when `.planning/` is gitignored and you want project-wide searches to include it

Example config:
```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## Common Workflows

**Starting a new project:**

```
/grd:new-project        # Unified flow: questioning â†’ research â†’ requirements â†’ roadmap
/clear
/grd:plan-phase 1       # Create plans for first phase
/clear
/grd:execute-phase 1    # Execute all plans in phase
```

**Resuming work after a break:**

```
/grd:progress  # See where you left off and continue
```

**Adding urgent mid-milestone work:**

```
/grd:insert-phase 5 "Critical security fix"
/grd:plan-phase 5.1
/grd:execute-phase 5.1
```

**Completing a milestone:**

```
/grd:complete-milestone 1.0.0
/clear
/grd:new-milestone  # Start next milestone (questioning â†’ research â†’ requirements â†’ roadmap)
```

**Debugging an issue:**

```
/grd:debug "form submission fails silently"  # Start debug session
# ... investigation happens, context fills up ...
/clear
/grd:debug                                    # Resume from where you left off
```

## Agent Teams

GRD leverages Claude Code's **Agent Teams** for coordinated multi-agent orchestration. Instead of spawning independent agents, GRD creates persistent teams with shared task lists and inter-agent messaging.

**How it works:**
- `/grd:execute-phase` creates team `grd-phase-{N}-execution` with executor agents as members
- `/grd:map-codebase` creates team `grd-codebase-mapping` with 4 mapper agents
- `/grd:new-project` creates team `grd-project-research` with 4 researcher agents

**What teams provide:**
- **Shared task list** -- all agents see the full work inventory, not just their own task
- **Structured progress** -- TaskList/TaskUpdate replace ad-hoc output parsing
- **Inter-agent messaging** -- agents coordinate on shared file conflicts via SendMessage
- **Clean lifecycle** -- TeamCreate/TeamDelete bracket each workflow cleanly

Teams are transparent to the user. They are created and torn down automatically by the orchestrating workflow.

## Getting Help

- Read `.planning/PROJECT.md` for project vision
- Read `.planning/STATE.md` for current context
- Check `.planning/ROADMAP.md` for phase status
- Run `/grd:progress` to check where you're up to
</reference>
