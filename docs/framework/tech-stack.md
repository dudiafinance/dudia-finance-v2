# Technology Stack: Dudia Finance v2

This document defines the official technology stack for the project. Agents must adhere to these choices when implementing new features.

## Frontend
- **Framework**: Next.js 16.2 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 (using CSS-first engine)
- **Components**: Shadcn UI (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## State Management & Data Fetching
- **Server State**: TanStack Query v5 (React Query)
- **Client State**: Zustand
- **Navigation**: Next.js App Router hooks (`useRouter`, `usePathname`)

## Backend & Database
- **Runtime**: Next.js Server Actions & API Routes
- **ORM**: Drizzle ORM 0.45+
- **Database**: PostgreSQL (Neon.tech)
- **Validation**: Zod
- **Auth**: Auth.js v5 (NextAuth) with Drizzle Adapter

## Testing & Tooling
- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Package Manager**: npm (standard)
- **AI Framework**: AIOX (AI-Orchestrated System) v4.0

## DevOps & Infrastructure
- **Hosting**: Vercel (recommended)
- **Database Hosting**: Neon
- **CI/CD**: GitHub Actions
