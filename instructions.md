# Internshala Clone — Local Setup

This is a Turborepo monorepo with two apps and a shared database package.

- `apps/web` : Next.js 16 frontend (NextAuth + Google OAuth)
- `apps/server` : Bun + Express API (Prisma, JWT, Razorpay, S3/MinIO)
- `packages/database` : Prisma schema and generated client

## 1. Prerequisites

Make sure the following are installed on your machine:

- Node.js 18 or above
- Bun 1.3 or above (`curl -fsSL https://bun.sh/install | bash`)
- Docker and Docker Compose

## 2. Clone and install

```sh
git clone <repo-url> internshala_clone
cd internshala_clone
bun install
```

This installs dependencies for every workspace (web, server, database, ui, configs).

## 3. Start the infrastructure

Postgres and MinIO (S3 compatible object storage) both run in Docker.

```sh
docker compose up -d
```

This starts:

- Postgres on port `5440` (user: `internshala`, password: `internshala`, db: `internshala_db`)
- MinIO S3 API on port `9000` and console on port `9001` (login: `internshala` / `internshala-secret`)
- A one-shot init container that creates the `internshala` bucket automatically

You can open the MinIO console at http://localhost:9001 to verify the bucket exists.

## 4. Environment variables

Three `.env` files are needed. The values below are the defaults that match the docker-compose setup, so you can copy them as is for local use.

### `apps/server/.env`

```
SERVER_JWT_SECRET=iambatman
SERVER_PORT=8081
DATABASE_URL="postgresql://internshala:internshala@localhost:5440/internshala_db"

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=internshala
MINIO_SECRET_KEY=internshala-secret
MINIO_BUCKET=internshala
```

### `packages/database/.env`

```
DATABASE_URL="postgresql://internshala:internshala@localhost:5440/internshala_db"
```

### `apps/web/.env`

```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081
NEXTAUTH_SECRET=iambatman
```

For Google OAuth, create credentials at https://console.cloud.google.com/apis/credentials and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. If you want to skip this for review, ask me for the temporary credentials I used during development.

## 5. Run database migrations

From the repo root:

```sh
cd packages/database
bunx prisma migrate deploy
bunx prisma generate
cd ../..
```

`migrate deploy` applies all migrations in `packages/database/prisma/migrations`. `generate` creates the typed Prisma client used by the server.

## 6. Run the apps

From the repo root, start everything in parallel using Turborepo:

```sh
bun run dev
```

Or run them individually in separate terminals:

```sh
# terminal 1: backend
cd apps/server && bun run dev

# terminal 2: frontend
cd apps/web && bun run dev
```

Once both are up:

- Frontend: http://localhost:3000
- Backend: http://localhost:8081 (API base path is `/api/v1`)

## 7. Quick verification

1. Open http://localhost:3000 and sign in with Google.
2. After login you should land on the dashboard.
3. Uploading a resume from the profile page should create an object in the `internshala` MinIO bucket. You can confirm this in the MinIO console at http://localhost:9001.

## Common issues

- **Port already in use**: change `SERVER_PORT` in `apps/server/.env`, or stop the process using that port.
- **Prisma client errors after schema changes**: re-run `bunx prisma generate` inside `packages/database`.
- **Google sign-in redirect mismatch**: make sure the redirect URI in your Google Cloud console exactly matches `http://localhost:3000/api/auth/callback/google`.
- **MinIO bucket missing**: the `minio-init` container creates it on first start. If it failed, run `docker compose up minio-init` again.

## Project scripts (root)

```sh
bun run dev          # run web and server together
bun run build        # build all apps
bun run lint         # lint all workspaces
bun run check-types  # typecheck all workspaces
bun run format       # prettier on ts/tsx/md
```

That is everything needed to get the project running locally. Reach out if anything breaks during setup.
