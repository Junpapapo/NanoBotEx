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

---

## 2. 개발 및 유지보수 가이드 (Maintenance Guidelines)
* **실시간성 검색 키워드 감지 (다국어 사전 확장)**:
  * `AUTO` 검색 모드에서 실시간 검색 필요 여부를 판단하기 위한 키워드 사전(`TEMPORAL_KEYWORDS_MAP` in [chatbot-constants.ts](file:///c:/00_Workspace/00_Module_Dev/NanoBotEx/src/shared/chatbot-constants.ts))은 성능(0ms Latency) 및 오프라인/보안 지원을 위해 로컬 다국어 사전 방식으로 구현되어 있습니다.
  * **새로운 다국어 로컬라이징(언어) 지원이 추가될 경우**, 반드시 해당 언어에 대한 실시간성 핵심 키워드 목록도 `TEMPORAL_KEYWORDS_MAP`에 추가로 등록해 주어야 합니다.

