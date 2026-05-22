# Talk and Relax — Admin Agent Spec

## What this is

An internal "chief of staff" agent embedded in the Talk and Relax Next.js admin portal. Read-only on day one. Produces a daily briefing and answers ad-hoc questions about the app, using Claude with tool use against the existing Supabase backend.

The owner is Mayur. The audience for the agent's output is Mayur. Be blunt, no hedging, no corporate filler.

## Stack assumptions

- Next.js 14+ App Router, TypeScript
- Supabase (Postgres) — already has user, session, message, feedback tables
- Anthropic SDK (`@anthropic-ai/sdk`)
- `xlsx` (SheetJS) for Excel generation
- Vercel for hosting and cron
- Auth: existing admin auth on the portal — agent routes must be behind it

If any of the above doesn't match what's already in the repo, ask before changing it.

## Hard rules

1. **Read-only.** No INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT, or any DDL. Enforce in two places:
   - Regex check on SQL strings in the tool handler (reject if it contains write keywords outside of string literals)
   - A dedicated Supabase Postgres role `agent_readonly` with only SELECT grants on specific tables. The agent connects as that role. Never as service_role.
2. **No sending.** `draft_message` returns text. It does not call WhatsApp, FCM, or email APIs.
3. **Every tool call is logged.** Append to an `agent_audit_log` table: timestamp, tool name, input, output summary (first 500 chars), duration_ms, user_id of the admin who triggered it.
4. **No hardcoded schema.** If the agent needs table structure, it queries `information_schema` live. Same pattern as the existing DataChat build.
5. **PII.** When SQL results contain user phone numbers or emails, mask them in the response (`98***43210`). The agent sees raw data, the rendered output masks it.

## Tools

Five tools, exact names and schemas:

### 1. `run_sql`
- Input: `{ query: string, reason: string }`
- Behavior: validates SELECT-only, runs against `agent_readonly` role, returns `{ rows, row_count, columns, truncated }`. Cap at 500 rows.
- Errors: return `{ error: "..." }`, don't throw.

### 2. `get_app_metrics`
- Input: `{ start_date: string (YYYY-MM-DD), end_date: string, metrics: string[] }`
- Allowed metrics: `dau`, `mau`, `retention_d1`, `retention_d7`, `retention_d30`, `avg_session_length`, `onboarding_funnel`, `language_split`
- Behavior: pre-written, optimized SQL for each metric. Don't let the agent reinvent these via `run_sql` — it'll be slow and inconsistent.

### 3. `generate_excel`
- Input: `{ filename: string, sheets: Array<{ name: string, rows: object[] }> }`
- Behavior: writes the .xlsx to Supabase Storage in an `agent-reports/` bucket, returns a signed URL valid for 24h.
- Filename gets sanitized + timestamped.

### 4. `draft_message`
- Input: `{ channel: "whatsapp" | "push" | "email" | "in_app", audience: string, intent: string, language?: "hindi" | "hinglish" | "english" }`
- Behavior: this is a sub-LLM call with a Talk and Relax brand voice system prompt. Returns drafted text. Does not send.
- Default language: hinglish.

### 5. `draft_content`
- Input: `{ type: "script" | "ad_copy" | "push_notif" | "blog" | "tagline", brief: string, tone?: string, length?: string }`
- Behavior: sub-LLM call with Talk and Relax brand context loaded. Returns the content.

## The planner (daily briefing)

System prompt for the briefing agent:

```
You are Mayur's chief of staff for Talk and Relax, a Hindi-speaking emotional wellness app for Indian audiences.

Your daily briefing has exactly three sections:

1. TOP 3 — the three things Mayur should focus on today, ranked by impact. Each item: one line of what + one line of why, citing real numbers from your tools. No more.

2. PULSE — DAU vs 7-day average, D1 and D7 retention, top friction point in onboarding. Three numbers, three sentences.

3. WATCH — anything in user feedback, reviews, or session drop-offs that needs a human eye in the next 24h. Skip this section if nothing qualifies — do not invent items.

Rules:
- Use tools to fetch every number. Never guess.
- If a tool returns no data or errors, say so plainly. Do not paper over gaps.
- Be blunt. Mayur is a technical founder who runs five projects. He wants signal.
- No emoji, no "exciting news!", no closing pep talk.
- Hindi/Hinglish content in user feedback: preserve the original, then translate in parentheses if non-obvious.

Output format: markdown, under 400 words total.
```

## API routes

### `POST /api/agent/brief`
- Auth: admin only
- Triggers the briefing loop, returns the markdown + the tool call trace
- Caches result for 1 hour keyed by date (so refreshing the page doesn't re-run it)

### `POST /api/agent/chat`
- Auth: admin only
- Body: `{ messages: Message[] }` — full history
- Streams the agentic loop: text deltas + tool_use events + tool_result events as SSE
- Uses same tool set as the briefing

### `GET /api/cron/daily-brief`
- Vercel cron, runs at 03:30 UTC (9:00 IST)
- Auth: `CRON_SECRET` header check
- Calls the briefing internally and stores result in `agent_briefings` table

## The agentic loop

Standard tool-use loop. Pseudocode:

```
messages = [initial_user_message]
while true:
  response = anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages
  })

  messages.push({ role: "assistant", content: response.content })

  if response.stop_reason == "end_turn":
    break

  if response.stop_reason == "tool_use":
    tool_results = []
    for block in response.content where block.type == "tool_use":
      result = await runTool(block.name, block.input)
      await logToAudit(block, result)
      tool_results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result)
      })
    messages.push({ role: "user", content: tool_results })
    continue

  break  // any other stop_reason, exit
```

Safety: cap at 10 iterations. If it hits the cap, return what's been generated plus a note that it stopped.

## UI

Single page at `/admin/agent`:

- **Top card**: today's briefing. Loads cached on mount, "Regenerate" button.
- **Tool trace**: collapsible accordion under the briefing showing every tool call (name, input, output preview, duration). This is what builds Mayur's trust before write access is granted.
- **Chat box**: below the briefing. Streams responses. Tool calls render inline as pills: `🔧 run_sql · 240ms · 23 rows` — click to expand.
- **Audit log**: separate tab at `/admin/agent/audit`. Sortable table of every tool call this week with filters.

Use shadcn/ui components (Card, Accordion, Button, Input). Tailwind. Match the existing admin portal styling.

## Database

Two new tables:

```sql
create table agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  admin_user_id uuid references auth.users(id),
  tool_name text not null,
  tool_input jsonb not null,
  tool_output_preview text,
  duration_ms int,
  error text
);

create table agent_briefings (
  date date primary key,
  content text not null,
  tool_trace jsonb,
  generated_at timestamptz default now()
);

create role agent_readonly nologin;
-- grants added per table by hand or migration; do not grant on auth schema
```

## What to build first

In this order. Don't get ahead.

1. The `agent_readonly` role + the two tables + a migration file.
2. `lib/agent/tools.ts` with all five tool definitions and handlers. Unit tests for SQL validation specifically (it's the security boundary).
3. The agentic loop in `lib/agent/loop.ts`, isolated, with a CLI script to invoke it (`scripts/test-agent.ts`) so we can iterate without the UI.
4. `/api/agent/brief` route using the loop.
5. The `/admin/agent` page — briefing card + tool trace only. No chat yet.
6. Chat route + streaming UI.
7. Cron + the audit log page.

After each step, stop and show Mayur what you built before continuing. Don't batch.

## What to ask before building

- Confirm the existing table names for users, sessions, messages, feedback so the metric queries are correct.
- Confirm whether the admin portal uses Supabase Auth or something else, so the route guards match.
- Confirm Vercel project has `ANTHROPIC_API_KEY` and `CRON_SECRET` in env vars; if not, list what needs to be added.

## Out of scope (do not build)

- Any write tool (sending messages, updating DB, modifying users).
- Memory beyond the current conversation. No vector store, no RAG.
- Multi-agent orchestration. One agent, one loop.
- Voice or image input.
- Anything for end users of Talk and Relax. This is admin-only.
