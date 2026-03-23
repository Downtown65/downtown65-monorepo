# Discuss: Epic Scoping

You are starting an interactive discussion to scope an epic before planning it.

## Your Task

1. **Read context** — Load these files silently (do NOT dump their contents):
   - `.planning/ROADMAP.md` (phase details, success criteria)
   - `.planning/REQUIREMENTS.md` (requirement IDs and status)
   - `.planning/STATE.md` (current project state)
   - `AGENTS.md` and referenced `doc/` files (tech stack and conventions)

2. **Identify the epic** — The user will specify which phase or feature to discuss. If not clear, ask.

3. **Present a brief summary** of what the roadmap already says about this work:
   - Goal and success criteria
   - Mapped requirements
   - Dependencies on completed phases
   - Any decisions already recorded in STATE.md

4. **Ask focused questions** to fill gaps. Good questions cover:
   - Scope boundaries: "Should X be included or deferred?"
   - Technical approach: "The roadmap says Y — any preference on how?"
   - UX decisions: "How should Z behave for the user?"
   - Priority: "What's most important to get right first?"
   - Constraints: "Any deadlines, blockers, or things to avoid?"

   Ask 3-5 questions at a time, not more. Wait for answers before asking more.

5. **Iterate** until the user is satisfied with the scope.

6. **Produce a scope summary** when the user says they're done discussing. Write it to `.planning/phases/<phase-dir>/SCOPE.md` with:

```markdown
# Scope: <Epic Title>

## Goal
<One sentence>

## Requirements
<List of requirement IDs this epic delivers>

## Key Decisions
<Bullet list of decisions made during discussion>

## Out of Scope
<What was explicitly deferred>

## Technical Approach
<High-level approach agreed on>
```

## Rules

- Be concise. No filler. Lead with substance.
- Don't repeat what the user just said back to them.
- Challenge vague answers — push for specifics.
- If the roadmap already has good detail, don't re-ask what's already decided.
- Reference requirement IDs (AUTH-01, EVNT-04, etc.) when relevant.
