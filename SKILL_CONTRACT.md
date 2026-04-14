---
contract_version: "1.0.0"
---

# Skill Contract

> **Contract version 1.0.0**  
> Maintained by the native skills module maintainers.

## Overview

A _skill_ is a self-contained Markdown file that describes one capability an agent can perform. The Markdown file is the source of truth: it tells agents what the skill does, what it accepts as input, what it produces as output, and how to invoke it. No Python ABC, Protocol, or declarative schema is required — the file itself is the interface.

The OpenHands SDK ingests Markdown files directly as agent context, so skills work without any additional adapter layer in both standard and sandboxed environments.

---

## Markdown File Structure

Every skill file must be a valid Markdown document with a YAML front-matter block at the top, followed by a set of required sections, and optionally one or more optional sections.

### Front-matter fields

The YAML front-matter block is delimited by `---` and must appear as the very first thing in the file.

**Required fields**

| Field              | Type     | Description                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `contract_version` | `string` | The version of this contract the skill conforms to (e.g. `"1.0.0"`).       |
| `name`             | `string` | Machine-readable skill identifier, `snake_case`, unique within the module.  |
| `version`          | `string` | The skill's own semantic version (e.g. `"1.0.0"`).                         |
| `description`      | `string` | A single sentence that summarises what the skill does.                      |

**Optional fields**

| Field    | Type           | Description                                                                     |
| -------- | -------------- | ------------------------------------------------------------------------------- |
| `author` | `string`       | The team or individual responsible for maintaining this skill.                  |
| `tags`   | `list[string]` | Searchable labels that help agents and tooling locate related skills.           |
| `since`  | `string`       | The first `contract_version` that introduced this skill (e.g. `"1.0.0"`).      |

**Minimal valid front-matter**

```yaml
---
contract_version: "1.0.0"
name: my_skill
version: "1.0.0"
description: "Does one specific thing very well."
---
```

---

### Required sections

The following Markdown headings must appear in every skill file, in the order listed. Each heading must be an H2 (`##`).

#### `## Description`

Prose explanation of what the skill does and why it exists. Two to four sentences. Avoid repeating the `description` front-matter field verbatim; add context instead.

#### `## Inputs`

A Markdown table with the columns `Name`, `Type`, `Required`, and `Description`. One row per input parameter.

```markdown
| Name  | Type     | Required | Description               |
| ----- | -------- | -------- | ------------------------- |
| token | `string` | Yes      | GitHub Personal Access Token. |
```

If the skill accepts no inputs, write `_None._` below the heading.

#### `## Outputs`

A Markdown table with the columns `Name`, `Type`, and `Description`. One row per output value.

```markdown
| Name   | Type     | Description                    |
| ------ | -------- | ------------------------------ |
| pr_url | `string` | URL of the opened pull request. |
```

If the skill produces no outputs, write `_None._` below the heading.

#### `## Usage`

A code block or prose that shows the minimal invocation needed to exercise the skill. At minimum this must demonstrate the required inputs. Prefer a concrete, copy-paste-ready example.

---

### Optional sections

The following sections may appear after the required sections in any order.

| Section          | Purpose                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| `## Examples`    | Additional concrete invocations that illustrate edge cases or common patterns.    |
| `## Limitations` | Known constraints, unsupported environments, or behaviours that may surprise users. |
| `## See Also`    | Relative links to related skill files or external documentation.                  |

---

## Composition Model

Skills follow an **additive / stacking** model.

- Each skill file is independent: it makes no assumptions about the presence or absence of other skills.
- When an agent loads multiple skills, their capabilities are _stacked_ — all descriptions, inputs, and usage guidance become part of the agent's context simultaneously.
- There is no ordered pipeline, no dependency graph, and no conflict-resolution logic between skills at this stage. If two skills overlap in responsibility, both remain available and the agent decides which to apply for a given task.
- A skill must not modify or extend another skill's Markdown file. Adding a new skill that covers adjacent functionality is always done by creating a new, independent file.

This design keeps skills composable without coordination overhead: adding skill B to an agent that already has skill A requires no changes to either file.

---

## Skill Discovery

Agents discover available skills by reading Markdown files from the `skills/` directory at the repository root. The exact mechanism depends on the runtime environment.

### Standard environments

In environments with unrestricted filesystem access, the agent (or the tooling that builds its context) glob-expands:

```
skills/**/*.md
```

from the repository root. Every `.md` file found is loaded, parsed, and added to the agent's context. Subdirectories inside `skills/` are allowed and can be used to organise skills by domain (e.g. `skills/git/`, `skills/github/`).

### Sandboxed / restricted environments (OpenHands)

OpenHands agents run inside a sandbox where direct filesystem glob access may not be available to the agent itself. Discovery works through two complementary paths:

1. **`AGENTS.md` (persistent memory)** — The repository-level `AGENTS.md` file is automatically loaded by the OpenHands SDK at the start of every conversation. Skill files can be referenced or inlined there so that the agent's context always includes them without requiring runtime glob access.

2. **`context_files` in `RunRequest`** — When launching an agent run via the `/runs` API, callers can include skill file paths in the `spec.context_files` list. The agent reads those files as part of its working context before it starts the task.

In both cases the agent receives the full Markdown content of each skill file and can act on it immediately.

---

## Versioning

### Contract version

The `contract_version` field in a skill file's front-matter identifies which revision of _this document_ the skill was written against. It follows [Semantic Versioning](https://semver.org/):

- **Major** — a breaking change to the contract (e.g. a required field is renamed or a required section is removed).
- **Minor** — a backward-compatible addition to the contract (e.g. a new optional field or section is introduced).
- **Patch** — a non-functional correction (e.g. a typo fix in this document).

Responsibility for bumping the contract version sits with the **native skills module maintainers**. Individual skill authors update the `contract_version` in their file when they bring it into conformance with a newer contract revision.

### Skill version

The `version` field tracks the skill's own history, independent of the contract. Authors increment it according to Semantic Versioning:

- **Major** — a breaking change to the skill's inputs or outputs.
- **Minor** — a backward-compatible addition (e.g. a new optional input).
- **Patch** — a documentation or description fix.

---

## Validation Checklist

Before merging a new skill file, verify:

- [ ] Front-matter block is present and delimited by `---`.
- [ ] `contract_version`, `name`, `version`, and `description` are all present and non-empty.
- [ ] `name` is `snake_case` and unique within the `skills/` directory tree.
- [ ] `## Description`, `## Inputs`, `## Outputs`, and `## Usage` sections all exist, in that order.
- [ ] `## Inputs` and `## Outputs` each contain either a populated table or `_None._`.
- [ ] `## Usage` contains at least one concrete invocation example.
- [ ] The file is placed under `skills/` in the repository root.
