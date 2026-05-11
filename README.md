# Claims — insurance claims demo (Django + React)

Monorepo for a **Django REST** API and a **React (Vite)** SPA: members, policies, policy purchases, claims, line items, and disputes. The app uses **SQLite** (no separate database install) and **JWT** authentication.

**For reviewers:** follow **Run the application** below on a clean machine. More API and folder detail lives in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

---

## Prerequisites

Install these before you start (any recent LTS version is fine):

| Tool | Notes |
|------|--------|
| **Python** | 3.11, 3.12, or 3.13 (`python3 --version`) |
| **Node.js** | 20.x or 22.x (`node --version`) |
| **npm** | Ships with Node (`npm --version`) |

No Docker or cloud services are required.

---

## Run the application

Use **two terminals**: one for the backend, one for the frontend. Keep both running.

### 1. Backend (terminal A)

```bash
cd backend
python3 -m venv .venv
```

Activate the virtual environment:

- **macOS / Linux:** `source .venv/bin/activate`
- **Windows (cmd):** `.venv\Scripts\activate.bat`
- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`

Then:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Leave this running. You should see Django listening on **http://127.0.0.1:8000/**.

The local database file is created at `backend/db.sqlite3` after `migrate`.

### 2. Frontend (terminal B)

```bash
cd frontend
npm install
npm run dev
```

Leave this running. Open **http://localhost:5173/** in a browser.

In development, Vite **proxies** `/api` to `http://127.0.0.1:8000`, so you do not need to configure CORS for local use.

### 3. Environment (optional)

The frontend works out of the box for local dev. If you want an explicit env file:

```bash
cd frontend
cp .env.example .env
```

Keep `VITE_API_BASE_URL` **empty** so the dev proxy is used (see `frontend/vite.config.ts`).

---

## First-time sign-in

There is no bundled seed user. Register an account against the running API, then sign in on the web app.

**Register** (with the backend still running):

```bash
curl -s -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"reviewer@example.com","password":"ReviewPass9!long","password_confirm":"ReviewPass9!long"}'
```

Use a **strong password** (Django’s validators apply). Then open **http://localhost:5173/login** and sign in with that email and password.

Typical flow in the UI after login:

1. **Members** — create a member profile linked to your user (required for claims and enrollments).
2. **Policies** — create a policy (and policy line items as needed).
3. **Member policies** — record a purchase / enrollment for your member.
4. **Claims** — create a claim; the policy list is limited to **active purchased** policies for the signed-in user.

---

## Verify with tests (optional)

Backend:

```bash
cd backend
source .venv/bin/activate    # Windows: use Activate.ps1 as above
pytest
```

Frontend (typecheck + production build):

```bash
cd frontend
npm run build
```

---

## Repository layout

| Path | Role |
|------|------|
| `backend/` | Django project, `manage.py`, SQLite DB, REST API under `/api/…` |
| `frontend/` | Vite + React SPA |

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| **Port 8000 in use** | Stop the other process or run `python manage.py runserver 8001` and point the Vite proxy in `frontend/vite.config.ts` at that port. |
| **Port 5173 in use** | Vite will suggest another port, or run `npm run dev -- --port 5174`. |
| **`python3` not found** | On Windows, install Python from python.org or use `py -3` instead of `python3`. |
| **`pip` / `pytest` not found** | Activate `backend/.venv` first, then `pip install -r requirements.txt`. |
| **401 / redirect to login** | Register and log in; JWT is stored in the browser (`localStorage`). |
| **Empty policy list on claims** | Ensure a **Member** exists for your user, then an active **Member policy** purchase (`/member-policies` in the UI). |

---

## API quick reference

- `POST /api/auth/register` — create user (no auth)
- `POST /api/auth/login` — JWT (`{"email","password"}` → `{"token"}`)
- Authenticated JSON API under `/api/members/`, `/api/policies/`, `/api/member-policies/`, `/api/claims/`, etc.

Full route list: [`backend/README.md`](backend/README.md).
