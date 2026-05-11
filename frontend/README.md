# Insurance management — frontend

React + Vite SPA for the Django REST API (JWT Bearer). This package is intentionally small: **routing**, **auth shell**, **API client**, **layout**, and **UI primitives** only — no insurance business screens yet.

## Tech stack

| Area            | Choice                          |
|-----------------|---------------------------------|
| Build           | Vite + TypeScript               |
| Routing         | React Router (data router)      |
| Server state    | TanStack Query                  |
| Forms           | React Hook Form                 |
| HTTP            | Axios + interceptors            |
| Styling         | Tailwind CSS + shadcn-style UI  |
| Icons           | Lucide React                    |

## Folder structure

```
frontend/
├── docs/
│   └── CONVENTIONS.md          # Team conventions
├── public/
├── src/
│   ├── app/
│   │   ├── AppProviders.tsx    # React Query provider
│   │   └── router.tsx          # Route definitions
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, TopNav
│   │   ├── routes/             # ProtectedRoute
│   │   └── ui/                 # Button, Card, Input (shadcn-style)
│   ├── features/
│   │   └── auth/               # token storage + login API helper
│   ├── lib/
│   │   ├── api.ts              # Axios instance + JWT + errors
│   │   ├── query-client.ts
│   │   └── utils.ts            # cn()
│   ├── pages/
│   │   ├── HomePage.tsx        # Placeholder home
│   │   └── LoginPage.tsx       # Minimal JWT login (not domain UI)
│   ├── index.css               # Tailwind + CSS variables
│   ├── main.tsx
│   └── vite-env.d.ts
├── components.json               # shadcn/ui metadata (optional CLI)
├── postcss.config.js
├── tailwind.config.cjs
├── vite.config.ts                # `@` alias + `/api` dev proxy
├── .env.example
└── package.json
```

## Initial setup (already done in repo)

```bash
cd frontend
npm create vite@latest . -- --template react-ts   # if starting fresh
npm install
```

## Install dependencies (reference)

```bash
cd frontend
npm install react-router-dom axios @tanstack/react-query react-hook-form \
  tailwindcss@3.4 postcss autoprefixer tailwindcss-animate \
  class-variance-authority clsx tailwind-merge \
  lucide-react @radix-ui/react-slot
```

Tailwind is pinned to **v3** for the classic `tailwind.config.cjs` + shadcn-style tokens.

## Environment

Copy `.env.example` to `.env` (optional in dev):

```bash
cp .env.example .env
```

- **`VITE_API_BASE_URL`**: leave **empty** for local dev so requests go to the same origin as Vite and the **proxy** forwards `/api` → `http://127.0.0.1:8000`.
- For production, set it to your API origin (no trailing slash), e.g. `https://api.example.com`.

## Scripts

```bash
npm run dev       # Vite dev server (default http://localhost:5173)
npm run build     # Typecheck + production bundle
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Local dev with Django

1. From the repo root, run Django from **`backend/`** on port **8000** (default), e.g. `cd backend && .venv/bin/python manage.py runserver`.
2. Run `npm run dev` in `frontend/`.
3. Open the Vite URL; API calls use paths like `/api/auth/login` and are proxied to Django (see `vite.config.ts`).

If you deploy the SPA and API on different origins, configure **CORS** on Django and set **`VITE_API_BASE_URL`** to the API origin.

## Routing (suggested growth)

| Path        | Purpose                          |
|------------|-----------------------------------|
| `/login`   | Public — sign in                  |
| `/`        | Protected — shell + home          |
| future…    | Add nested routes under `AppShell` |

Edit `src/app/router.tsx` and `src/components/layout/Sidebar.tsx` when you add modules.

## JWT

- Stored in **`localStorage`** under `claims_jwt_access_token`.
- Attached on every request as **`Authorization: Bearer <token>`** (`src/lib/api.ts`).
- **401** responses clear the token and redirect to `/login` (except the login request itself).

## Conventions

See **`docs/CONVENTIONS.md`**.

## shadcn/ui

`components.json` is present so you can run `npx shadcn@latest add <component>` later; a minimal **Button**, **Card**, and **Input** are already included by hand to avoid interactive CLI in this scaffold.
