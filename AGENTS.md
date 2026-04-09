# AIOX Agents Hierarchy & Command Map

## Overview
This project uses the AIOX (AI-Orchestrated System) framework. Use the agents below by mentioning their handle (e.g., `@dev`) followed by a command or request.

## Stack Information
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn UI
- **Backend:** Next.js Server Actions, Drizzle ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js (Auth.js v5)
- **Testing:** Vitest, Testing Library

---

## 🤖 Available Agents

### 🏛️ Planning Agents (Phase 1)
- **@analyst**: Business requirements analysis & PRD creation.
- **@architect**: System design, directory structure, and technical strategy.
- **@pm**: Project management, story prioritization, and backlog.

### 🛠️ Execution Agents (Phase 2)
- **@sm**: Scrum Master. Orchestrates development by creating and managing story files.
- **@dev**: Implementation expert. Writes code following project patterns.
- **@qa**: Quality Assurance. Writes tests and verifies bug fixes.
- **@devops**: CI/CD, database migrations (Drizzle), and Git operations.

---

## 📋 Standard Commands
- `*help`: Show agent capabilities.
- `*create-story`: Initialize a new feature/bug story file.
- `*execute-subtask [id]`: Start working on a specific part of a story.
- `*map-codebase`: (@architect) Generate current project map.
- `*review-build`: (@qa) Perform code review and run tests.

## 📜 Development Rules
1. Always check for an active story file in `docs/stories/` before coding.
2. Follow **Clean Architecture** and **Server-First** principles (Next.js).
3. Use **Drizzle ORM** for all database interactions.
4. Ensure **Accessibility (A11y)** using Shadcn components.
