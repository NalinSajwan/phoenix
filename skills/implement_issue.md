---
contract_version: "1.0.0"
name: implement_issue
version: "1.0.0"
description: "Implement a GitHub issue by writing code changes in an isolated git worktree and opening a draft pull request."
author: "Phoenix native skills"
tags: [github, git, coding, pull-request, worktree]
since: "1.0.0"
---

## Description

This skill resolves a GitHub issue by autonomously writing the required code changes, committing them to a dedicated branch in an isolated git worktree, and optionally opening a draft pull request against the repository's base branch. The agent reads the issue's intent, acceptance criteria, and any supplied context files before starting, then uses file-editing and terminal tools to implement the changes. Isolation via git worktrees means multiple issues can be implemented concurrently without branches interfering with each other.

## Inputs

| Name                  | Type            | Required | Description                                                                                          |
| --------------------- | --------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `issue_number`        | `integer`       | Yes      | The GitHub issue number to implement.                                                                |
| `repo_full_name`      | `string`        | Yes      | Repository in `owner/repo` format.                                                                   |
| `spec.intent`         | `string`        | Yes      | One-sentence description of what the issue asks for.                                                 |
| `spec.acceptance_criteria` | `list[string]` | Yes | Binary pass/fail conditions that define done.                                                   |
| `spec.technical_notes` | `string`       | No       | Additional context or implementation hints.                                                          |
| `spec.context_files`  | `list[string]`  | No       | Repository-relative paths to files the agent should read before starting.                            |
| `base_branch`         | `string`        | No       | Branch to create the PR against. Defaults to `main`.                                                 |
| `create_draft_pr`     | `boolean`       | No       | When `true` (default), opens a draft PR instead of a ready-for-review PR.                           |
| `autonomy`            | `string`        | No       | `assist` (default) — waits for user push approval; `autonomous` — pushes and creates PR immediately. |
| `llm_model`           | `string`        | No       | LiteLLM model string override (e.g. `anthropic/claude-opus-4-6`).                                   |
| `llm_api_key`         | `string`        | No       | API key for the chosen LLM provider.                                                                 |
| `max_iterations`      | `integer`       | No       | Maximum agent loop iterations before the run is terminated.                                          |

## Outputs

| Name            | Type           | Description                                                                             |
| --------------- | -------------- | --------------------------------------------------------------------------------------- |
| `branch_name`   | `string`       | Name of the branch containing the committed changes (e.g. `pnx/issue-42`).             |
| `pr_url`        | `string`       | URL of the opened GitHub pull request. Empty if `autonomy` is `assist` and the user has not yet pushed. |
| `files_changed` | `list[string]` | Repository-relative paths of every file added, modified, or deleted.                   |
| `summary`       | `string`       | Short prose summary of the changes written by the agent.                                |

## Usage

Post a `RunRequest` to the `/runs` endpoint of the Phoenix agent service:

```bash
curl -X POST http://localhost:8001/runs \
  -H "Content-Type: application/json" \
  -d '{
    "issue_number": 42,
    "repo_full_name": "acme/my-app",
    "spec": {
      "intent": "Add a dark-mode toggle to the settings page",
      "acceptance_criteria": [
        "A toggle switch appears in Settings under Appearance",
        "Selecting dark mode persists across page reloads",
        "All existing Playwright tests still pass"
      ]
    }
  }'
```

The response contains a `run_id` and a `stream_url`. Stream SSE events from `stream_url` to follow progress in real time.

## Examples

**Autonomous mode with context hints**

```bash
curl -X POST http://localhost:8001/runs \
  -H "Content-Type: application/json" \
  -d '{
    "issue_number": 99,
    "repo_full_name": "acme/my-app",
    "spec": {
      "intent": "Paginate the /users endpoint",
      "acceptance_criteria": [
        "GET /users accepts ?page and ?per_page query params",
        "Default page size is 20",
        "Response includes next_cursor when more results exist"
      ],
      "technical_notes": "Uses cursor-based pagination; avoid offset queries on large tables.",
      "context_files": ["agent/routes/users.py", "agent/models.py"]
    },
    "autonomy": "autonomous",
    "llm_model": "anthropic/claude-opus-4-6"
  }'
```

**Checking run status after streaming completes**

```bash
curl http://localhost:8001/runs/{run_id}/status
```

Returns `{"status": "complete", "pr_url": "https://github.com/acme/my-app/pull/103", ...}` once the PR is open.

## Limitations

- Requires a GitHub Personal Access Token with `repo` write scope available to the agent service.
- The worktree approach serialises concurrent runs on the same base clone (one fetch at a time per repository); throughput scales with the number of distinct repositories, not with issue count within a single repository.
- `autonomy: assist` runs leave a local worktree on disk until the user manually triggers `/runs/{run_id}/push`. Stale worktrees are pruned on service restart.
- The skill does not create the target repository or its base branch; both must exist before the run starts.

## See Also

- [`SKILL_CONTRACT.md`](../SKILL_CONTRACT.md) — the full skill interface specification.
- [`agent/agent.py`](../agent/agent.py) — `ImplementerAgent` implementation that executes this skill.
- [`agent/routes/runs.py`](../agent/routes/runs.py) — REST endpoints for starting, streaming, and managing runs.
