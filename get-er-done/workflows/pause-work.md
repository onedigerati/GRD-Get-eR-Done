<purpose>
Save current project position to STATE.md when pausing work. Claude Code's auto-memory preserves full session context automatically.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="read_state">
Read STATE.md to get current position:

```bash
cat .planning/STATE.md
```

Note the current phase, plan, and status.
</step>

<step name="update_timestamp">
Update STATE.md session continuity with current timestamp:

```bash
timestamp=$(node ~/.claude/get-er-done/bin/grd-tools.js current-timestamp full --raw)
```

Update the Session Continuity section in STATE.md with the timestamp.
</step>

<step name="check_pending_items">
Use TodoRead to check for pending deferred items. Track the count for the confirmation message.
</step>

<step name="confirm">
Display to user:

```
✔ Project state saved to STATE.md
  [N] deferred items tracked (omit line if 0)

  Auto-memory will preserve your full session context,
  including key decisions and blockers from this session.
  Use /grd:resume to pick up where you left off.
```
</step>

</process>

<success_criteria>
- [ ] STATE.md session timestamp updated
- [ ] User informed of how to resume
</success_criteria>
