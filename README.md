# Claims — monorepo

This repository contains a **Django REST** backend and a **React (Vite)** frontend.

| Part       | Path        | Notes                                      |
|-----------|-------------|--------------------------------------------|
| Backend   | `backend/`  | Python virtualenv lives at `backend/.venv` |
| Frontend  | `frontend/` | See `frontend/README.md`                   |

## Backend quick start

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Run tests:

```bash
cd backend
.venv/bin/python -m pytest
```

## Frontend quick start

```bash
cd frontend
npm install
npm run dev
```

With Django on `http://127.0.0.1:8000`, the Vite dev server proxies `/api` to the backend (see `frontend/vite.config.ts`).
