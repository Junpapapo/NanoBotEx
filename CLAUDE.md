# CLAUDE.md - Technical & Build Guidelines

This document specifies the core compile/build commands, technical constraints, and modular standards for this project.

> [!IMPORTANT]
> All technical operations MUST comply with this document and the global [[common-rules.md](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.agents/rules/common-rules.md)] guidelines.

---

## 1. Technical Build & Command Reference

| Action | Command | Purpose |
| :--- | :--- | :--- |
| Install Dependencies | `npm install` / `rtk install` | Set up workspace libraries |
| Type/Compile Verification | `npx tsc --noEmit` | Strict pre-push compilation check |
| Start Dev Server | `npm run dev` | Run local development environment |
| Build Production | `npm run build` | Compile final bundle for distribution |

---

## 2. Project Architecture & Decoupling Limits

* **Module Architecture Enforcement**:
  * Proactively break down complex components and views into separate feature modules.
  * Files MUST NOT exceed **400 lines of code**. For detailed code scaffolding, refer to [[proactive-code-architect](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.gemini/skills/proactive-code-architect/SKILL.md)].
* **Surgical Edits Only**:
  * Only touch lines within the target scope. Do not clean up unrelated legacy files.
  * Clean up any unused imports or variables introduced *by your changes* before committing.
