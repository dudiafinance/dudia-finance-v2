# Task: Consult Advisor

**ID:** consult-advisor
**Description:** Handoff a complex problem to the @advisor to receive a strategic plan.

## Workflow

1. **Context Collection**: Gather relevant files (PRD, Architecture, current code snippet) into a context shard.
2. **Identification**: Clear description of the roadblock or architectural decision needed.
3. **Handoff**: Switch to @advisor persona or send the shard to the advisor model.
4. **Synthesis**: Advisor produces a [Plan of Action] artifact.
5. **Resume**: Worker agent consumes the plan and continues execution.

## Instructions

- If you encounter a problem that requires more than 3 steps to solve or involves core architectural changes, **HALT** and call this task.
- Ensure the shard includes:
  - `intent`: What we are trying to achieve.
  - `blocker`: Why we need the advisor.
  - `references`: Files to read.
- Format the request as: `*consult {intent} --ref {files}`.
