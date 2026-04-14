# Phoenix Repository — Agent Memory

## Architecture

### Frontend (Astro + Preact islands + vanilla JS)
- `src/lib/implementer.js` — core agent run lifecycle: starts runs, manages SSE streams, persists run/log state to localStorage
- `src/lib/signals.js` — bridges `runStore`/`logStore` to `@preact/signals` so Preact islands auto-render
- `src/scripts/run-dispatcher.js` — maps issues + agent config to `implement()` / `refine()` calls
- `src/scripts/main.js` — page init, service health checks, panel toggles

### Backend (FastAPI, Python)
- `agent/routes/runs.py` — POST /runs (create), GET /runs/{id}/stream (SSE), GET /runs/{id}/status, GET /runs/{id}/logs, DELETE /runs/{id}
- `agent/registry.py` — in-memory `_runs: dict[str, RunState]` — agent tasks survive SSE stream disconnection
- `agent/agent.py` — `ImplementerAgent`: asyncio task that emits events to a queue and persists every event to SQLite via `db.append_run_log`
- `agent/db.py` — SQLite at `~/.pnx/pnx.db`: `repos`, `issue_movements`, `run_logs` tables

## Key Patterns

### Agent session lifecycle (decoupled from SSE)
- `POST /runs` creates an `asyncio.Task` stored in `_runs`; the SSE stream is a separate consumer
- Closing/refreshing the browser disconnects the SSE consumer but does NOT cancel the task
- The task writes every event to both: (a) an in-memory asyncio Queue (for live streaming) and (b) SQLite `run_logs` (for replay)
- `GET /runs/{id}/logs` returns the full persisted event history

### Post-refresh reconnection (implemented in issue #38)
After a browser refresh, `implementer.js` checks the backend for still-active runs and reconnects:
1. `_loadPersisted` IIFE: `running` runs with a `runId` are queued in `_pendingReconnects` (not marked failed)
2. `_reconnectRun(issueNumber)`: checks `/runs/{runId}/status` → reconnects SSE if still running; restores final state if complete/failed
3. `_loadBackendLogs(...)`: fetches `/runs/{runId}/logs`, repopulates `logStore` with authoritative DB history
4. `_openStream(issueNumber, url, skipBeforeTs)`: shared SSE consumer; `skipBeforeTs` gates out events already seen via `_loadBackendLogs`
5. `runId` is stored in `runStore` immediately when `implement()` gets the stream URL — this is what enables reconnection

### runStore entry shape
```js
{
  status: 'pending'|'running'|'done'|'failed'|'needs_review'|'cancelled',
  step: string,          // current step description
  prUrl: string|null,
  runId: string,         // backend run UUID (stored as soon as POST /runs responds)
  _endpoint: string,     // agent server base URL
  actionType: 'implement'|'refine',
  model: string|null,
  cost: { inputTokens, outputTokens, estimatedUsd, model } | null,
  branch: string|null,   // set on needs_review
  worktreePath: string|null,
}
```

### SSE event types (backend → frontend)
`start`, `progress`, `reasoning`, `tool_call`, `tool_result`, `needs_review`, `complete`, `error`, `close`, `ping`

### `needs_review` vs `complete`
- `autonomy: 'assist'|'semi-autonomous'` → agent emits `needs_review`; user must click Push to create PR
- `autonomy: 'autonomous'` → agent emits `complete` with `pr_pending: true`; PR created in background

## Testing
- Backend: `cd agent && uv run pytest`
- Frontend: no test suite; build check: `npm run build`
