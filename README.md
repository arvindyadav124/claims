# Insurance claims processing (Django + DRF)

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Tests

```bash
pytest
```

## API routes

- `/api/members` — members (list/create); detail `/api/members/<id>`
- `/api/policies` — policy products (list/create)
- `/api/claims` — claims; optional filter `?policy_id=`
- `/admin/` — Django admin (`python manage.py createsuperuser`)

Domain apps live under `apps/` (`members`, `policies`, `claims`). Each app keeps **models**, **services** (calls into the ORM and rules), **serializers**, **views**, and **tests** together.
