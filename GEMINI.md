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
* **DO NOT Mix Unharmonious Theme Colors (No Random Dark Charcoal on Light Mode)**: 라이트 테마 환경에 어두운 차콜/네이비 등의 이질적인 배경색을 임의로 섞지 말 것. 라이트 테마는 밝고 화사한 라이트 배색, 다크 테마는 고급스러운 딥 다크 배색을 철저히 구분하여 서브창 및 팝업 요소에 완벽히 연동 적용한다.
* **DO NOT Write Vendor-Specific Code (No Single-Browser Dependence)**: 특정 브라우저(예: Chrome 전용 API 등)에만 종속되는 비표준 코딩을 절대 작성하지 않는다.

### 🟢 DO (MANDATORY ACTIONS)
* **Speak Korean in Chat**: You **MUST** respond, report progress, explain changes, and summarize results in **Korean** at all times.
* **Mandatory Universal Cross-Browser Compatibility (전체 브라우저 호환성 필수)**: 모든 기능, 오디오/미디어, UI, 이벤트 코딩은 **Whale, Safari, Edge, Firefox, Chrome** 등 모든 주요 브라우저에서 100% 동일하게 정상 작동하도록 W3C 표준 사양으로 구현한다.
* **Master & Apply Proactive Code Architect Skill**: 코딩 작업 시 반드시 workspace 내의 [[proactive-code-architect](file:///c:/00_Workspace/00_Module_Dev/Pomogochi/.gemini/skills/proactive-code-architect)] 지침 및 설계 원칙을 철저히 숙지하고 준수한다.
* **Figma-Style High Quality UI Design**: AI 특유의 투박하거나 뜬금없는 템플릿 형태를 배제하고, 피그마(Figma) 전문 디자이너가 작업한 듯한 세련되고 정교하며 완성도 높은 UI/UX 디자인을 항상 적용한다.
* **Proactive Brainstorming**: Treat the pairing process as a collaborative brainstorm. Actively suggest structured options, improvements, and architectural solutions before code edits.
* **Goal-Driven Execution**: State a brief step-by-step verification plan before editing. Always check the build status synchronously (e.g. `npx tsc --noEmit` or `npm run build` inside `frontend/`) before final delivery.
* **Symmetric Git Lifecycle**: Commit and push changes safely only after successful automated build verifications.

### 🎨 MANDATORY UI DESIGN STYLE GUIDELINES (사용자 선호 UI 규칙)
* **Compact & High-Density Padding (여백/패딩 극단적 축소)**: 붕 뜨는 상하좌우 빈 공간이나 불필요한 마진/패딩을 철저히 배제하고, 요소 간 공간을 타이트하고 콤팩트하게 밀착 배치한다.
* **Full-Area Utilization (주어진 영역 100% 시원하게 사용)**: 모달, 팝업, 사이드바 내에서 요소를 쪼그라뜨리지 않고, 주어진 가로/세로 영역 전체를 꽉 채워 시원시원하게 펼친다.
* **No Unnecessary Outer Borders/Wrappers (이중 껍데기 제거)**: 요소를 이중으로 감싸는 무의미한 배경 박스나 연한 겉 테두리를 제거하여 투명하고 깔끔하게 레이아웃을 정돈한다.
* **Zero Clipping & Precision Fitting (잘림 현상 절대 방지)**: 텍스트, 버튼, 아이콘, 하단 스크롤 항목이 잘리거나 모달 밖으로 삐져나가지 않도록 flex 및 `min-width: 0`, `flex-shrink: 0`을 정밀 적용한다.
* **Slim Custom Scrollbars & Refined Details (5px 슬림 스크롤바 & 정교함)**: 두껍고 투박한 기본 스크롤바 대신 `5px` 얇은 커스텀 미니 스크롤바를 적용하고 세련된 호버 애니메이션과 입체 그림자를 유지한다.
* **No Native Browser Popups (브라우저 기본 팝업 금지)**: `alert()`, `confirm()`, `prompt()` 등 투박한 브라우저 기본 팝업 사용을 절대 금지하며, 세련된 커스텀 인라인 모달/팝업 UI만 적용한다.
