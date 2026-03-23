# Plan Epic: Create beads epic with tasks

You are creating a beads epic from a scoped discussion.

## Your Task

1. **Read the scope** — Load the scope file for the phase being planned:
   - `.planning/phases/<phase-dir>/SCOPE.md` (from /discuss)
   - `.planning/ROADMAP.md` (success criteria, phase details)
   - `AGENTS.md` and referenced `doc/` files (tech stack, conventions, coding patterns)

   If no SCOPE.md exists, tell the user to run `/discuss` first.

2. **Research the codebase** — Before planning, explore the current code relevant to this epic:
   - Existing patterns, components, and conventions
   - What's already built that this epic builds on
   - Integration points with existing code

3. **Draft the epic breakdown** — Present a structured plan to the user:

   ```
   Epic: <Title>

   Tasks (in dependency order):
   1. <Task title> — <one-line description>
      Depends on: nothing | task N
   2. <Task title> — <one-line description>
      Depends on: task 1
   ...
   ```

   Guidelines for task breakdown:
   - Each task should be completable in one session (1-3 hours of work)
   - Tasks should have clear, verifiable completion criteria
   - Order by dependency — what must exist before the next thing can be built
   - Group related work, but don't make tasks too large
   - Include test tasks where integration tests add value

4. **Get approval** — Ask the user to confirm, adjust, or re-order tasks.

5. **Create in beads** — Once approved, execute the `bd` commands:

   ```bash
   # Create epic
   EPIC_ID=$(bd create "<Epic Title>" -t epic -p <priority> \
     -d "<Epic description with goal and requirements>" --silent)

   # Create tasks as children with dependencies
   TASK1=$(bd create "<Task 1>" -t task --parent $EPIC_ID \
     -d "<Description with acceptance criteria>" --silent)

   TASK2=$(bd create "<Task 2>" -t task --parent $EPIC_ID \
     --deps "blocks:$TASK1" \
     -d "<Description with acceptance criteria>" --silent)
   # ...etc
   ```

6. **Show the result** — Run `bd epic status <epic-id>` and `bd graph <epic-id>` to display the created structure.

## Task Description Template

Each task description should include:
```
What: <what to build>
Why: <which requirements this delivers>
Acceptance: <how to verify it's done>
```

## Rules

- Keep tasks focused — one concern per task.
- Use `--deps "blocks:<id>"` for real dependencies, not just ordering preferences.
- Priority: epic inherits from roadmap, tasks default to P2 unless critical path.
- Don't create tasks for trivial work (config tweaks, import changes).
- If a task maps to a specific requirement, mention the ID (e.g., AUTH-01) in the description.
- Run all `bd create` commands sequentially (each needs the ID from the previous).
