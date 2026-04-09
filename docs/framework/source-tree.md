# Source Tree Documentation: Dudia Finance v2

This document provides a detailed overview of the source tree and project structure for **Dudia Finance v2**, based on the AIOX (AI-Orchestrated System) framework.

---

## 1. Root Structure
The root directory contains project-wide configuration, environment files, and primary top-level folders.

| Folder/File | Description |
| :--- | :--- |
| `.aiox-core/` | **AIOX Framework Core.** Contains agent definitions, CLI tools, core logic, and orchestrator configurations. |
| `docs/` | Project documentation, including PRDs, architecture notes, and AIOX story files (`docs/stories/`). |
| `drizzle/` | Drizzle ORM migrations (SQL files) and metadata. |
| `public/` | Static assets such as images, icons, and fonts accessible via the web root. |
| `scripts/` | Utility and automation scripts for development and deployment. |
| `src/` | **Application Source Code.** The main development area. |
| `skills/` & `tools/` | Extensions for AI agents (AIOX specific). |
| `.env.*` | Environment variable files (local, development, production). |
| `AGENTS.md` | AIOX Agents Hierarchy and Command Map. |
| `package.json` | Project dependencies and scripts. |
| `tsconfig.json` | TypeScript configuration. |
| `next.config.ts` | Next.js framework configuration. |
| `drizzle.config.ts` | Drizzle ORM configuration for database migrations. |
| `vitest.config.ts` | Vitest configuration for unit and integration testing. |

---

## 2. `src/` Folder Structure
The `src` directory follows a modern Next.js 16 (App Router) architecture combined with clean architecture principles.

### `src/app/`
Contains the Next.js App Router logic, following the file-based routing system.
- **`(app)/`**: Route group for the main application features (Dashboard, Transactions, Accounts) intended for authenticated users.
- **`(auth)/`**: Route group for authentication flows (Login, Register, Password Reset).
- **`api/`**: Backend API routes (Serverless Functions).
- **`layout.tsx` & `page.tsx`**: Root layout and homepage.
- **`globals.css`**: Tailwind CSS global styles.

### `src/components/`
Modular UI components organized by responsibility.
- **`ui/`**: Low-level, reusable components (mostly Shadcn/Radix UI).
- **`layout/`**: Structural components like Sidebar, Navbar, and Shell.
- **`forms/`**: Complex form implementations using `react-hook-form` and `zod`.
- **`charts/`**: Data visualization components.
- **`providers/`**: Context providers (Theme, Auth, QueryClient).

### `src/lib/`
Shared logic, utilities, and core services.
- **`db/`**: Database client initialization and schema definitions.
- **`services/`**: Business logic layer (e.g., `financial-engine.ts`, `email.ts`).
- **`validations/`**: Zod schemas for data validation.
- **`utils/`**: Helper functions (formatting, encryption, etc.).
- **`auth/`**: Auth.js (NextAuth) configuration and utilities.

---

## 3. Database Schemas
The project uses **Drizzle ORM** with a PostgreSQL (Neon) database.

- **Schema Definitions:** `src/lib/db/schema/index.ts`
- **Database Client:** `src/lib/db/index.ts`
- **Migrations:** `drizzle/` folder (root).

---

## 4. Configuration Files
- **Next.js:** `next.config.ts`
- **Styling:** `tailwind.config.ts`
- **Database:** `drizzle.config.ts`
- **UI Components:** `components.json`
- **AIOX:** `.aiox-core/core-config.yaml`
