# AIOX Agents Hierarchy & Command Map

## Overview
This project uses the **AIOX (AI-Orchestrated System)** framework v4.0. Use the agents below by mentioning their handle (e.g., `@dev`) followed by a command or request.

## Stack Information
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn UI
- **Backend:** Next.js Server Actions, Drizzle ORM
- **Database:** PostgreSQL (Neon)
- **Auth:** NextAuth.js (Auth.js v5)
- **Testing:** Vitest, Testing Library

---

## 🤖 Available Agents

### 🏛️ Planning Agents (Phase 1)
- **@analyst**: Business requirements analysis & PRD creation.
- **@pm**: Product Manager. Feature prioritization, roadmap, and backlog management.
- **@architect**: System design, technical strategy, and architectural patterns.
- **@ux-expert**: UX/UI design, accessibility (A11y), and design systems.
- **@advisor**: Strategic guidance, architectural review, and complex problem resolution.

### 🛠️ Execution Agents (Phase 2)
- **@sm**: Scrum Master. Orchestrates development, manages stories and subtasks.
- **@po**: Product Owner. Story validation and acceptance criteria.
- **@dev**: Senior Full-Stack Developer. Implementation and bug fixing.
- **@data-engineer**: Database specialist. Drizzle schemas, migrations, and RLS.
- **@qa**: Quality Assurance. Automated tests and code review.
- **@devops**: CI/CD, deployment, and infrastructure.

### 🧩 Meta Agents
- **@aiox-master**: Universal orchestrator with access to all skills.
- **@squad-creator**: Specialized in spawning sub-agents for complex features.

---

## 📋 Standard Commands
- `*help`: Show agent capabilities.
- `*guide`: Show detailed usage instructions.
- `*status`: Show current project progress and active story.
- `*create-story`: (@sm) Initialize a new feature/bug story file.
- `*map-codebase`: (@architect) Generate current project map.
- `*db-migrate`: (@data-engineer) Generate and apply Drizzle migrations.
- `*review-build`: (@qa) Perform code review and run tests.

## 📜 Development Rules
1. **Stories First**: Always check for an active story file in `docs/stories/` before coding.
2. **Clean Architecture**: Follow Server-First principles (Next.js 16).
3. **Drizzle-Native**: Use Drizzle ORM for all database interactions.
4. **Persistent Memory**: Agents update `MEMORY.md` to ensure continuity across chats.
5. **Accessibility**: All UI components must use Shadcn (Radix) for A11y.

---
**Location of Definitions:** `.aiox-core/development/agents/`
