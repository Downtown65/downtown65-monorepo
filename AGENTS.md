# Downtown 65 Ecosystem

DT65 sports club ecosystem -- 3 Cloudflare Workers apps + shared package in a pnpm monorepo.

## Documentation

| Topic | File |
|-------|------|
| Architecture, tech stack, workspace structure | [doc/architecture.md](doc/architecture.md) |
| Commands & local development | [doc/commands.md](doc/commands.md) |
| Environment variables (VarLock) | [doc/environment.md](doc/environment.md) |
| Coding conventions (commits, naming, patterns, TS, deps) | [doc/conventions.md](doc/conventions.md) |
| CI, pre-push hooks, project references | [doc/ci.md](doc/ci.md) |
| Non-interactive shell commands (agent safety) | [doc/agent-shell.md](doc/agent-shell.md) |

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### New Environment Setup

When starting from a fresh environment (e.g., OpenClaw, new machine):

```bash
bd dolt pull          # Pull all issues and history from DoltHub remote
bd ready              # Verify sync — check available work
```

Always `bd dolt pull` before starting work in a new environment to ensure you have the latest issue state.

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
