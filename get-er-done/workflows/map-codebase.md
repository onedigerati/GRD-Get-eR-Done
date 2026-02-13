<purpose>
Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .planning/codebase/

Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</purpose>

<philosophy>
**Why dedicated mapper agents:**
- Fresh context per domain (no token contamination)
- Agents write documents directly (no context transfer back to orchestrator)
- Orchestrator only summarizes what was created (minimal context usage)
- Faster execution (agents run simultaneously)

**Agent Teams coordination:**
- Mappers join team `grd-codebase-mapping` for shared task tracking
- Each focus area is a task in the shared list â€" visible to all agents
- TaskUpdate provides structured completion signals (no output parsing)
- TeamDelete cleans up when mapping finishes

**Document quality over length:**
Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.

**Always include file paths:**
Documents are reference material for Claude when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.
</philosophy>

<process>

<step name="init_context" priority="first">
Load codebase mapping context:

```bash
INIT=$(node ~/.claude/get-er-done/bin/grd-tools.js init map-codebase)
```

Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`.
</step>

<step name="check_existing">
Check if .planning/codebase/ already exists using `has_maps` from init context.

If `codebase_dir_exists` is true:
```bash
ls -la .planning/codebase/
```

**If exists:**

```
.planning/codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh - Delete existing and remap codebase
2. Update - Keep existing, only update specific documents
3. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .planning/codebase/, continue to create_structure
If "Update": Ask which documents to update, continue to spawn_agents (filtered)
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory:

```bash
mkdir -p .planning/codebase
```

**Expected output files:**
- STACK.md (from tech mapper)
- INTEGRATIONS.md (from tech mapper)
- ARCHITECTURE.md (from arch mapper)
- STRUCTURE.md (from arch mapper)
- CONVENTIONS.md (from quality mapper)
- TESTING.md (from quality mapper)
- CONCERNS.md (from concerns mapper)

Continue to spawn_agents.
</step>

<step name="spawn_agents">
**Create the mapping team and register tasks:**

```
TeamCreate(name="grd-codebase-mapping")

TaskCreate(subject="Map tech stack and integrations", description="Analyze languages, runtime, frameworks, dependencies, external APIs, databases, auth providers. Write STACK.md and INTEGRATIONS.md.", activeForm="Mapping tech stack")
TaskCreate(subject="Map architecture and structure", description="Analyze system patterns, layers, data flow, directory layout, key locations. Write ARCHITECTURE.md and STRUCTURE.md.", activeForm="Mapping architecture")
TaskCreate(subject="Map conventions and testing", description="Analyze code style, naming, patterns, test framework, mocking, coverage. Write CONVENTIONS.md and TESTING.md.", activeForm="Mapping conventions")
TaskCreate(subject="Map concerns and tech debt", description="Analyze technical debt, bugs, security issues, performance, fragile areas. Write CONCERNS.md.", activeForm="Mapping concerns")
```

Spawn 4 parallel grd-codebase-mapper agents as team members.

Use Task tool with `subagent_type="grd-codebase-mapper"`, `model="{mapper_model}"`, `team_name="grd-codebase-mapping"`, and `run_in_background=true` for parallel execution.

**CRITICAL:** Use the dedicated `grd-codebase-mapper` agent, NOT `Explore`. The mapper agent writes documents directly.

**Agent 1: Tech Focus**

Task tool parameters:
```
subagent_type: "grd-codebase-mapper"
model: "{mapper_model}"
team_name: "grd-codebase-mapping"
run_in_background: true
description: "Map codebase tech stack"
```

Prompt:
```
Focus: tech

You are a member of team 'grd-codebase-mapping'. Use TaskUpdate to mark your task completed when done. Use SendMessage to DM the orchestrator if you hit issues.

Analyze this codebase for technology stack and external integrations.

Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

Explore thoroughly. Write documents directly using templates. Mark your team task completed. Return confirmation only.
```

**Agent 2: Architecture Focus**

Task tool parameters:
```
subagent_type: "grd-codebase-mapper"
model: "{mapper_model}"
team_name: "grd-codebase-mapping"
run_in_background: true
description: "Map codebase architecture"
```

Prompt:
```
Focus: arch

You are a member of team 'grd-codebase-mapping'. Use TaskUpdate to mark your task completed when done. Use SendMessage to DM the orchestrator if you hit issues.

Analyze this codebase architecture and directory structure.

Write these documents to .planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions

Explore thoroughly. Write documents directly using templates. Mark your team task completed. Return confirmation only.
```

**Agent 3: Quality Focus**

Task tool parameters:
```
subagent_type: "grd-codebase-mapper"
model: "{mapper_model}"
team_name: "grd-codebase-mapping"
run_in_background: true
description: "Map codebase conventions"
```

Prompt:
```
Focus: quality

You are a member of team 'grd-codebase-mapping'. Use TaskUpdate to mark your task completed when done. Use SendMessage to DM the orchestrator if you hit issues.

Analyze this codebase for coding conventions and testing patterns.

Write these documents to .planning/codebase/:
- CONVENTIONS.md - Code style, naming, patterns, error handling
- TESTING.md - Framework, structure, mocking, coverage

Explore thoroughly. Write documents directly using templates. Mark your team task completed. Return confirmation only.
```

**Agent 4: Concerns Focus**

Task tool parameters:
```
subagent_type: "grd-codebase-mapper"
model: "{mapper_model}"
team_name: "grd-codebase-mapping"
run_in_background: true
description: "Map codebase concerns"
```

Prompt:
```
Focus: concerns

You are a member of team 'grd-codebase-mapping'. Use TaskUpdate to mark your task completed when done. Use SendMessage to DM the orchestrator if you hit issues.

Analyze this codebase for technical debt, known issues, and areas of concern.

Write this document to .planning/codebase/:
- CONCERNS.md - Tech debt, bugs, security, performance, fragile areas

Explore thoroughly. Write document directly using template. Mark your team task completed. Return confirmation only.
```

Continue to collect_confirmations.
</step>

<step name="collect_confirmations">
Wait for all 4 agents to complete. Monitor via the shared task list:

```
TaskList()  # All 4 mapping tasks should show 'completed'
```

When all tasks show completed, the mapping is done. If any agent fails or goes idle without completing, check its task status and use SendMessage to wake it or note the failure.

If any agent failed, note the failure and continue with successful documents.

**Tear down the mapping team:**
```
TeamDelete(name="grd-codebase-mapping")
```

Continue to verify_output.
</step>

<step name="verify_output">
Verify all documents created successfully:

```bash
ls -la .planning/codebase/
wc -l .planning/codebase/*.md
```

**Verification checklist:**
- All 7 documents exist
- No empty documents (each should have >20 lines)

If any documents missing or empty, note which agents may have failed.

Continue to scan_for_secrets.
</step>

<step name="scan_for_secrets">
**CRITICAL SECURITY CHECK:** Scan output files for accidentally leaked secrets before committing.

Run secret pattern detection:

```bash
# Check for common API key patterns in generated docs
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

**If SECRETS_FOUND=true:**

```
âš ï¸  SECURITY ALERT: Potential secrets detected in codebase documents!

Found patterns that look like API keys or tokens in:
[show grep output]

This would expose credentials if committed.

**Action required:**
1. Review the flagged content above
2. If these are real secrets, they must be removed before committing
3. Consider adding sensitive files to Claude Code "Deny" permissions

Pausing before commit. Reply "safe to proceed" if the flagged content is not actually sensitive, or edit the files first.
```

Wait for user confirmation before continuing to commit_codebase_map.

**If SECRETS_FOUND=false:**

Continue to commit_codebase_map.
</step>

<step name="commit_codebase_map">
Commit the codebase map:

```bash
node ~/.claude/get-er-done/bin/grd-tools.js commit "docs: map existing codebase" --files .planning/codebase/*.md
```

Continue to offer_next.
</step>

<step name="offer_next">
Present completion summary and next steps.

**Get line counts:**
```bash
wc -l .planning/codebase/*.md
```

**Output format:**

```
Codebase mapping complete.

Created .planning/codebase/:
- STACK.md ([N] lines) - Technologies and dependencies
- ARCHITECTURE.md ([N] lines) - System design and patterns
- STRUCTURE.md ([N] lines) - Directory layout and organization
- CONVENTIONS.md ([N] lines) - Code style and patterns
- TESTING.md ([N] lines) - Test structure and practices
- INTEGRATIONS.md ([N] lines) - External services and APIs
- CONCERNS.md ([N] lines) - Technical debt and issues


---

## â–¶ Next Up

**Initialize project** â€” use codebase context for planning

`/grd:new-project`

<sub>`/clear` first â†’ fresh context window</sub>

---

**Also available:**
- Re-run mapping: `/grd:map-codebase`
- Review specific file: `cat .planning/codebase/STACK.md`
- Edit any document before proceeding

---
```

End workflow.
</step>

</process>

<success_criteria>
- .planning/codebase/ directory created
- Team 'grd-codebase-mapping' created with 4 tasks
- 4 parallel grd-codebase-mapper agents spawned as team members with run_in_background=true
- Agents write documents directly (orchestrator doesn't receive document contents)
- Agents mark their shared tasks completed via TaskUpdate
- Orchestrator monitors completion via TaskList
- All 7 codebase documents exist
- Team torn down via TeamDelete
- Clear completion summary with line counts
- User offered clear next steps in GRD style
</success_criteria>
