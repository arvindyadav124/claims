# Frontend conventions

## Layout

- **Routing**: `src/app/router.tsx` — keep route trees shallow; use nested routes under `ProtectedRoute` + `AppShell`.
- **Global providers**: `src/app/AppProviders.tsx` — only cross-cutting providers (e.g. React Query).
- **Pages**: `src/pages/` — route-level components (thin; compose features).
- **Features**: `src/features/<name>/` — API helpers, hooks, and types for a domain area.
- **Shared UI**: `src/components/ui/` — shadcn-style primitives; `src/components/layout/` for shell pieces.

## Data fetching

- Prefer **TanStack Query** (`useQuery` / `useMutation`) for anything that talks to the server.
- Centralize HTTP in **`src/lib/api.ts`** (`api` axios instance). Do not create ad-hoc axios instances.

## Forms

- Use **React Hook Form** for interactive forms; keep validation rules colocated with the form unless reused.

## Styling

- **Tailwind** utility-first; use `cn()` from `@/lib/utils` when merging conditional classes.
- Prefer tokens from `src/index.css` (CSS variables) over hard-coded colors where possible.

## Auth

- JWT is stored under **`claims_jwt_access_token`** in `localStorage` (`tokenStorage.ts`).
- The axios response interceptor clears the token and redirects on **401** (except failed login).

## TypeScript

- Prefer `type` for object shapes; use `import type` for type-only imports when `verbatimModuleSyntax` complains.

## Environment

- **`VITE_API_BASE_URL`**: empty in dev when using the Vite `/api` proxy; set explicitly for production builds.
