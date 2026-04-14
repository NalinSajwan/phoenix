---
contract_version: "1.0.0"
name: skill_name
version: "1.0.0"
description: "One sentence describing what this skill does."
---

# Skill: Skill Name

## Description

Two to four sentences explaining what the skill does and why it exists.
Expand on the front-matter `description` field — add context, motivation,
and any nuance that helps an agent decide whether to apply this skill.

## Inputs

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| …    | …    | Yes / No | …           |

<!-- If the skill accepts no inputs, replace the table with: _None._ -->

## Outputs

| Name | Type | Description |
| ---- | ---- | ----------- |
| …    | …    | …           |

<!-- If the skill produces no outputs, replace the table with: _None._ -->

## Usage

<!-- Show the minimal invocation needed to exercise the skill.
     Prefer a concrete, copy-paste-ready example. -->

```text
<!-- example invocation or task description here -->
```

---

<!-- Optional sections — delete any that do not apply. -->

## Examples

<!-- Additional concrete invocations that illustrate edge cases or common patterns. -->

### Input

```text
<!-- Representative issue title + body or task description -->
```

### Expected output

```text
<!-- Describe or show what a correct agent response looks like -->
```

## Limitations

<!-- Known constraints, unsupported environments, or behaviours that may surprise users. -->

## See Also

<!-- Relative links to related skill files or external documentation. -->

---

<!-- Before submitting:
     1. Rename this file to <your_skill_name>.md (snake_case, matches `name` field above)
     2. Update all front-matter fields (contract_version, name, version, description)
     3. Fill in every required section (Description, Inputs, Outputs, Usage)
     4. Delete optional sections you don't need
     5. Remove all placeholder comments (this block included)
     6. Verify the skill appears via:
        python -c "from native_skills import list_skills; print(list_skills())"
-->
