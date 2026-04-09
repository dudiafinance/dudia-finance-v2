# Coding Standards & Best Practices

## General Principles
- **Clean Architecture**: Separate business logic from UI components.
- **Server-First**: Prefer Server Components and Server Actions over Client Components when possible.
- **Type Safety**: No `any`. Use strict TypeScript types.
- **Accessibility**: Use Shadcn/Radix primitives to ensure A11y.

## Frontend Standards
- **Components**: Functional components with PascalCase. Use `ts-ignore` only as a last resort.
- **Hooks**: Custom hooks should start with `use`.
- **Styling**: Use Tailwind utility classes. Avoid inline styles or custom CSS unless necessary.
- **Data Fetching**: Use TanStack Query for all client-side data fetching. Use Server Actions for mutations.

## Backend Standards
- **API Routes**: Follow RESTful naming conventions. Use Zod for input validation.
- **Drizzle Schema**: Define relations explicitly. Use the `createdAt` and `updated_at` timestamps for all tables.
- **Error Handling**: Use structured error responses `{ success: false, error: "message" }`. Log detailed errors on the server, not the client.
- **Security**: Always check user ownership using `getUserId()` from `@/lib/auth-utils` in all data-accessing routes.

## AIOX Workflow
- **Stories First**: Never code without an active story in `docs/stories/`.
- **Memory**: Update `MEMORY.md` after significant changes.
- **Commit Messages**: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
