# Claude Code Prompt — Talk and Relax Admin Agent

Paste this as your first message in Claude Code, with `AGENT_SPEC.md` placed at the repo root.

---

Read `AGENT_SPEC.md` at the repo root. That document is the source of truth for what we're building — a read-only chief-of-staff agent embedded in the Talk and Relax Next.js admin portal.

Before writing any code, do this:

1. Read the spec end-to-end.
2. Scan the existing repo to understand: framework version, folder conventions, how Supabase is currently wired, existing auth pattern, UI library in use, env var setup. Reference what you find by file path when you talk about it.
3. Surface every assumption in the spec that conflicts with what's actually in the repo. List them as a numbered list. Don't fix them silently.
4. Ask the three "What to ask before building" questions from the spec, plus anything else that's genuinely blocking.

Wait for my answers. Do not start building until I say go.

Once I confirm, follow the "What to build first" section in order. After each numbered step:
- Show me a diff summary of what changed
- Run anything testable (lint, typecheck, the test-agent CLI script)
- Stop and wait for my "next" before moving to the next step

Rules that override anything else:
- Read-only means read-only. If I ever ask you to add a write tool in this build, refuse and remind me we agreed to ship read-only first.
- The SQL validator in `run_sql` is the security boundary. Write tests for it before wiring it into the loop. I want to see attempted-injection cases pass through the validator and get rejected.
- No hardcoded schema, no hardcoded sample data, no mocked tool outputs in production code. The DataChat build taught us this — live introspection only.
- Match the existing portal's code style. If the repo uses a particular pattern for API routes, use that pattern. Don't introduce new conventions.
- Be blunt in PR descriptions and comments. No "exciting feature!" language. This is internal tooling.

When you hit something genuinely ambiguous, ask. When you hit something where you have a clear opinion, state it and proceed — don't ask permission for every micro-decision.

Start with step 1: read the spec, scan the repo, surface conflicts, ask the blocking questions.
