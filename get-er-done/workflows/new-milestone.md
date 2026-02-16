<purpose>

Start a new milestone cycle for an existing project. Loads project context, gathers milestone goals (from MILESTONE-CONTEXT.md or conversation), updates PROJECT.md and STATE.md, optionally runs parallel research, defines scoped requirements with REQ-IDs, spawns the roadmapper to create phased execution plan, and commits all artifacts. Brownfield equivalent of new-project.

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

## 1. Load Context

- Read PROJECT.md (existing project, validated requirements, decisions)
- Read MILESTONES.md (what shipped previously)
- Read STATE.md (pending todos, blockers)
- Check for MILESTONE-CONTEXT.md (from /grd:discuss-milestone)

## 2. Gather Milestone Goals

**If MILESTONE-CONTEXT.md exists:**
- Use features and scope from discuss-milestone
- Present summary for confirmation

**If no context file:**
- Present what shipped in last milestone
- Ask: "What do you want to build next?"
- Use AskUserQuestion to explore features, priorities, constraints, scope

## 3. Determine Milestone Version

- Parse last version from MILESTONES.md
- Suggest next version (v1.0 â†’ v1.1, or v2.0 for major)
- Confirm with user

## 4. Update PROJECT.md

Add/update:

```markdown
## Current Milestone: v[X.Y] [Name]

**Goal:** [One sentence describing milestone focus]

**Target features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]
```

Update Active requirements section and "Last updated" footer.

## 5. Update STATE.md

```markdown
## Current Position

Phase: Not started (defining requirements)
Plan: â€”
Status: Defining requirements
Last activity: [today] â€” Milestone v[X.Y] started
```

Keep Accumulated Context section from previous milestone.

## 6. Cleanup and Commit

Delete MILESTONE-CONTEXT.md if exists (consumed).

```bash
node ~/.claude/get-er-done/bin/grd-tools.js commit "docs: start milestone v[X.Y] [Name]" --files .planning/PROJECT.md .planning/STATE.md
```

## 7. Load Context and Resolve Models

```bash
INIT=$(node ~/.claude/get-er-done/bin/grd-tools.js init new-milestone)
```

Extract from init JSON: `researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `research_enabled`, `current_milestone`, `project_exists`, `roadmap_exists`.

## 8. Research Decision

AskUserQuestion: "Research the domain ecosystem for new features before defining requirements?"
- "Research first (Recommended)" â€” Discover patterns, features, architecture for NEW capabilities
- "Skip research" â€” Go straight to requirements

**Persist choice to config** (so future `/grd:plan-phase` honors it):

```bash
# If "Research first": persist true
node ~/.claude/get-er-done/bin/grd-tools.js config-set workflow.research true

# If "Skip research": persist false
node ~/.claude/get-er-done/bin/grd-tools.js config-set workflow.research false
```

**If "Research first":**

```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 GRD â–º RESEARCHING
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Assembling team: grd-milestone-research â€" 4 agents

| # | Role | Produces | Focus |
|---|------|----------|-------|
| 1 | Stack Researcher | `.planning/research/STACK.md` | Stack additions/changes for new features |
| 2 | Feature Researcher | `.planning/research/FEATURES.md` | Expected behavior, table stakes, differentiators |
| 3 | Architecture Researcher | `.planning/research/ARCHITECTURE.md` | Integration with existing architecture |
| 4 | Pitfalls Researcher | `.planning/research/PITFALLS.md` | Common mistakes when adding these features |

Spawning 4 agents in parallel...
```

```bash
mkdir -p .planning/research
```

**Create the research team and register tasks:**

```
TeamCreate(name="grd-milestone-research")

TaskCreate(subject="Research stack additions", description="Investigate stack changes needed for new milestone features. Write .planning/research/STACK.md.", activeForm="Researching stack additions")
TaskCreate(subject="Research features", description="Investigate feature expectations for new milestone. Write .planning/research/FEATURES.md.", activeForm="Researching features")
TaskCreate(subject="Research architecture integration", description="Investigate how new features integrate with existing architecture. Write .planning/research/ARCHITECTURE.md.", activeForm="Researching architecture")
TaskCreate(subject="Research pitfalls", description="Investigate common mistakes when adding these features. Write .planning/research/PITFALLS.md.", activeForm="Researching pitfalls")
```

Spawn 4 parallel grd-project-researcher agents as team members. Each uses this template with dimension-specific fields:

**Common structure for all 4 researchers:**
```
Task(team_name="grd-milestone-research", prompt="
<team_context>
You are a member of team 'grd-milestone-research'. Use TaskUpdate to mark your task completed when done. Use SendMessage to DM the orchestrator if you hit issues.
</team_context>

<research_type>Project Research â€" {DIMENSION} for [new features].</research_type>

<milestone_context>
SUBSEQUENT MILESTONE â€” Adding [target features] to existing app.
{EXISTING_CONTEXT}
Focus ONLY on what's needed for the NEW features.
</milestone_context>

<question>{QUESTION}</question>

<project_context>[PROJECT.md summary]</project_context>

<downstream_consumer>{CONSUMER}</downstream_consumer>

<quality_gate>{GATES}</quality_gate>

<output>
Write to: .planning/research/{FILE}
Use template: ~/.claude/get-er-done/templates/research-project/{FILE}
</output>
", subagent_type="grd-project-researcher", model="{researcher_model}", description="{DIMENSION} research")
```

**Dimension-specific fields:**

| Field | Stack | Features | Architecture | Pitfalls |
|-------|-------|----------|-------------|----------|
| EXISTING_CONTEXT | Existing validated capabilities (DO NOT re-research): [from PROJECT.md] | Existing features (already built): [from PROJECT.md] | Existing architecture: [from PROJECT.md or codebase map] | Focus on common mistakes when ADDING these features to existing system |
| QUESTION | What stack additions/changes are needed for [new features]? | How do [target features] typically work? Expected behavior? | How do [target features] integrate with existing architecture? | Common mistakes when adding [target features] to [domain]? |
| CONSUMER | Specific libraries with versions for NEW capabilities, integration points, what NOT to add | Table stakes vs differentiators vs anti-features, complexity noted, dependencies on existing | Integration points, new components, data flow changes, suggested build order | Warning signs, prevention strategy, which phase should address it |
| GATES | Versions current (verify with Context7), rationale explains WHY, integration considered | Categories clear, complexity noted, dependencies identified | Integration points identified, new vs modified explicit, build order considers deps | Pitfalls specific to adding these features, integration pitfalls covered, prevention actionable |
| FILE | STACK.md | FEATURES.md | ARCHITECTURE.md | PITFALLS.md |

Monitor research completion via the shared task list:
```
TaskList()  # All 4 research tasks should show 'completed'
```

After all 4 complete, tear down the research team and spawn synthesizer:
```
TeamDelete(name="grd-milestone-research")
```

Display synthesizer indicator:
```
â—† Spawning synthesizer â€" produces `.planning/research/SUMMARY.md`
  Focus: Aggregate findings from all 4 research dimensions
```

```
Task(prompt="
Synthesize research outputs into SUMMARY.md.

Read: .planning/research/STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

Write to: .planning/research/SUMMARY.md
Use template: ~/.claude/get-er-done/templates/research-project/SUMMARY.md
Commit after writing.
", subagent_type="grd-research-synthesizer", model="{synthesizer_model}", description="Synthesize research")
```

Display key findings from SUMMARY.md:
```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 GRD â–º RESEARCH COMPLETE âœ“
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

**Stack additions:** [from SUMMARY.md]
**Feature table stakes:** [from SUMMARY.md]
**Watch Out For:** [from SUMMARY.md]
```

**If "Skip research":** Continue to Step 9.

## 9. Define Requirements

```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 GRD â–º DEFINING REQUIREMENTS
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
```

Read PROJECT.md: core value, current milestone goals, validated requirements (what exists).

**If research exists:** Read FEATURES.md, extract feature categories.

Present features by category:
```
## [Category 1]
**Table stakes:** Feature A, Feature B
**Differentiators:** Feature C, Feature D
**Research notes:** [any relevant notes]
```

**If no research:** Gather requirements through conversation. Ask: "What are the main things users need to do with [new features]?" Clarify, probe for related capabilities, group into categories.

**Scope each category** via AskUserQuestion (multiSelect: true):
- "[Feature 1]" â€” [brief description]
- "[Feature 2]" â€” [brief description]
- "None for this milestone" â€” Defer entire category

Track: Selected â†’ this milestone. Unselected table stakes â†’ future. Unselected differentiators â†’ out of scope.

**Identify gaps** via AskUserQuestion:
- "No, research covered it" â€” Proceed
- "Yes, let me add some" â€” Capture additions

**Generate REQUIREMENTS.md:**
- v1 Requirements grouped by category (checkboxes, REQ-IDs)
- Future Requirements (deferred)
- Out of Scope (explicit exclusions with reasoning)
- Traceability section (empty, filled by roadmap)

**REQ-ID format:** `[CATEGORY]-[NUMBER]` (AUTH-01, NOTIF-02). Continue numbering from existing.

**Requirement quality criteria:**

Good requirements are:
- **Specific and testable:** "User can reset password via email link" (not "Handle password reset")
- **User-centric:** "User can X" (not "System does Y")
- **Atomic:** One capability per requirement (not "User can login and manage profile")
- **Independent:** Minimal dependencies on other requirements

Present FULL requirements list for confirmation:

```
## Milestone v[X.Y] Requirements

### [Category 1]
- [ ] **CAT1-01**: User can do X
- [ ] **CAT1-02**: User can do Y

### [Category 2]
- [ ] **CAT2-01**: User can do Z

Does this capture what you're building? (yes / adjust)
```

If "adjust": Return to scoping.

**Commit requirements:**
```bash
node ~/.claude/get-er-done/bin/grd-tools.js commit "docs: define milestone v[X.Y] requirements" --files .planning/REQUIREMENTS.md
```

## 10. Create Roadmap

```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 GRD â–º CREATING ROADMAP
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

â—† Spawning roadmapper â€" produces `.planning/ROADMAP.md`, `.planning/STATE.md`
  Focus: Phase breakdown, requirement mapping, success criteria derivation
```

**Starting phase number:** Read MILESTONES.md for last phase number. Continue from there (v1.0 ended at phase 5 â†’ v1.1 starts at phase 6).

```
Task(prompt="
<planning_context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md (if exists)
@.planning/config.json
@.planning/MILESTONES.md
</planning_context>

<instructions>
Create roadmap for milestone v[X.Y]:
1. Start phase numbering from [N]
2. Derive phases from THIS MILESTONE's requirements only
3. Map every requirement to exactly one phase
4. Derive 2-5 success criteria per phase (observable user behaviors)
5. Validate 100% coverage
6. Write files immediately (ROADMAP.md, STATE.md, update REQUIREMENTS.md traceability)
7. Return ROADMAP CREATED with summary

Write files first, then return.
</instructions>
", subagent_type="grd-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

**Handle return:**

**If `## ROADMAP BLOCKED`:** Present blocker, work with user, re-spawn.

**If `## ROADMAP CREATED`:** Read ROADMAP.md, present inline:

```
## Proposed Roadmap

**[N] phases** | **[X] requirements mapped** | All covered âœ“

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| [N] | [Name] | [Goal] | [REQ-IDs] | [count] |

### Phase Details

**Phase [N]: [Name]**
Goal: [goal]
Requirements: [REQ-IDs]
Success criteria:
1. [criterion]
2. [criterion]
```

**Ask for approval** via AskUserQuestion:
- "Approve" â€” Commit and continue
- "Adjust phases" â€” Tell me what to change
- "Review full file" â€” Show raw ROADMAP.md

**If "Adjust":** Get notes, re-spawn roadmapper with revision context, loop until approved.
**If "Review":** Display raw ROADMAP.md, re-ask.

**Commit roadmap** (after approval):
```bash
node ~/.claude/get-er-done/bin/grd-tools.js commit "docs: create milestone v[X.Y] roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 11. Done

```
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
 GRD â–º MILESTONE INITIALIZED âœ“
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

**Milestone v[X.Y]: [Name]**

| Artifact       | Location                    |
|----------------|-----------------------------|
| Project        | `.planning/PROJECT.md`      |
| Research       | `.planning/research/`       |
| Requirements   | `.planning/REQUIREMENTS.md` |
| Roadmap        | `.planning/ROADMAP.md`      |

**[N] phases** | **[X] requirements** | Ready to build âœ“

## â–¶ Next Up

**Phase [N]: [Phase Name]** â€” [Goal]

`/grd:discuss-phase [N]` â€” gather context and clarify approach

<sub>`/clear` first â†’ fresh context window</sub>

Also: `/grd:plan-phase [N]` â€” skip discussion, plan directly
```

</process>

<success_criteria>
- [ ] PROJECT.md updated with Current Milestone section
- [ ] STATE.md reset for new milestone
- [ ] MILESTONE-CONTEXT.md consumed and deleted (if existed)
- [ ] Research completed (if selected) â€” 4 parallel agents, milestone-aware
- [ ] Requirements gathered and scoped per category
- [ ] REQUIREMENTS.md created with REQ-IDs
- [ ] grd-roadmapper spawned with phase numbering context
- [ ] Roadmap files written immediately (not draft)
- [ ] User feedback incorporated (if any)
- [ ] ROADMAP.md phases continue from previous milestone
- [ ] All commits made (if planning docs committed)
- [ ] User knows next step: `/grd:discuss-phase [N]`

**Atomic commits:** Each phase commits its artifacts immediately.
</success_criteria>
