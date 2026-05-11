# Insurance claims processing (Django + DRF)

All backend commands assume your **current working directory is this folder** (`backend/`), where `manage.py` and `.venv` live.

## Local setup

```bash
cd backend                    # from repo root
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The virtual environment is **`backend/.venv`** (ignored by git). If you still have an old `.venv` at the repository root from before the move, remove it and create a new venv here as above.

## Tests

```bash
cd backend
.venv/bin/python -m pytest
# or, with the venv activated:
pytest
```

## API routes (prefix `/api`)

- `/api/auth/` — register, login (JWT)
- `/api/members/` — members (list/create); detail `/api/members/<id>`
- `/api/policies/` — policies and policy items
- `/api/claims/` — claims, line items, disputes
- `/api/member-policies/` — member policy purchases
- `/admin/` — Django admin (`python manage.py createsuperuser`)

Domain apps live under `apps/` (`auth_app`, `members`, `policies`, `claims`, `member_policies`). Each app keeps **models**, **services** (ORM and rules), **serializers**, **views**, and **tests** together.
