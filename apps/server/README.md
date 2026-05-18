# Server (FastAPI)

Python backend for the Internshala clone. Built with FastAPI, SQLAlchemy 2.0,
PyJWT, boto3 (MinIO/S3), and Razorpay.

## Layout

```
app/
  main.py             # FastAPI app, CORS, exception handlers, /api/v1 mount
  config.py           # Settings (pydantic-settings, reads .env)
  responses.py        # JSON envelope + ApiError hierarchy
  serializers.py      # ORM -> dict (mirrors Prisma's JSON shape)
  deps.py             # FastAPI deps: db, current_user, require_company_member
  core/
    jwt.py            # issue / verify
    plans.py          # paid-plan catalogue
    storage.py        # MinIO/S3 helpers
  db/
    enums.py          # mirrors Prisma enums
    models.py         # SQLAlchemy 2.0 models that mirror the Prisma schema
    session.py        # engine + session factory
  schemas/            # Pydantic request bodies, one file per resource
  services/
    notification.py   # best-effort notify / notify_many
  routers/            # one file per feature; all mounted under /api/v1
```

## Schema ownership

The database schema is **owned by Prisma** in
[`packages/database/prisma/schema.prisma`](../../packages/database/prisma/schema.prisma).
Migrations are still run with Prisma. The SQLAlchemy models in
[`app/db/models.py`](app/db/models.py) are a hand-mirrored read/write layer
pointed at the same Postgres database, with `Enum(..., create_type=False)` so
SQLAlchemy will never try to redefine the enum types Prisma created.

When the Prisma schema changes:
1. Run `bunx prisma migrate dev` from `packages/database` as usual.
2. Update `app/db/models.py` (and `app/db/enums.py` if you added an enum
   value) to match.

## Running

```bash
# from this directory
uv sync
uv run uvicorn app.main:app --reload --port 8081
```

The server listens on `SERVER_PORT` from `.env`. By default `/api/v1/health`
returns `{ "ok": true }`.

## Environment

See `.env` (already present). Required keys:

```
SERVER_JWT_SECRET=...
SERVER_PORT=8081
DATABASE_URL=postgresql://user:pass@host:port/db
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=...
```

Optional:

```
MINIO_PUBLIC_ENDPOINT=https://...
MINIO_REGION=us-east-1
SERVER_RAZORPAY_ID=...
SERVER_RAZORPAY_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

If Razorpay keys are absent, `/payment/order` and `/payment/verify` return
500 with a clear message — every other endpoint works.

## Response envelope

All responses use the same shape so the existing frontend continues to work:

```jsonc
// success
{ "success": true, "data": ..., "message": "...", "metadata": { "timestamp": "..." } }

// error
{ "success": false, "error": { "code": "...", "message": "..." }, "metadata": { "timestamp": "..." } }
```

Codes: `UNAUTHORIZED` (401/403), `INVALID_REQUEST` (400), `NOT_FOUND` (404),
`INTERNAL_SERVER_ERROR` (500).
