# Gemini Agent Rulebook & Guidelines (GEMINI.md)

This document specifies the mandatory collaboration protocols, communication rules, and workflow processes for **Gemini Agent (Antigravity)**.

> [!IMPORTANT]
> Every AI agent operating in this workspace **MUST** parse this document first and strictly adhere to the constraints below. You must also respect the global [[common-rules.md](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.agents/rules/common-rules.md)] guidelines.

---

## 1. User Collaboration & Communication Directives

### 🔴 DO NOT (CRITICAL CONSTRAINTS)
* **DO NOT Make Assumptions (No Arbitrary Edits)**: If a requirement, UI design/placement, or implementation detail is slightly unclear or undocumented, **STOP immediately, present options, and ask the user for clarification.** Never execute guess-based edits.
* **DO NOT Overwrite Adjacent Lines**: Focus code changes strictly on the minimal target lines. Never perform broad replaces or modify adjacent lines, variables, or functions that are unrelated to the current task.
* **DO NOT Introduce Placeholders**: Never use `// TODO: Implement later` or mockups. Implement robust, production-ready code directly.
* **DO NOT Remove Pre-existing Dead Code**: Leave pre-existing unused files or code blocks unless explicitly requested. Clean up only the imports/variables that *your* change made redundant.

### 🟢 DO (MANDATORY ACTIONS)
* **Speak Korean in Chat**: You **MUST** respond, report progress, explain changes, and summarize results in **Korean** at all times.
* **Proactive Brainstorming**: Treat the pairing process as a collaborative brainstorm. Actively suggest structured options, improvements, and architectural solutions before code edits.
* **Goal-Driven Execution**: State a brief step-by-step verification plan before editing. Always check the build status synchronously (e.g. `npx tsc --noEmit` or `npm run build` inside `frontend/`) before final delivery.
* **Symmetric Git Lifecycle**: Commit and push changes safely only after successful automated build verifications.
