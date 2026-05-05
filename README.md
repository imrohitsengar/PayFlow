# PayFlow — Monorepo

A full-stack digital payments platform built with Next.js, Express, and PostgreSQL — managed as a Turborepo monorepo.

---

## 🏗️ Architecture

```
paytm-project-starter-monorepo/
├── apps/
│   ├── user-app/       # Next.js 14 — customer-facing wallet (port 3001)
│   └── bank-webhook/   # Express — receives bank payment confirmations (port 3003)
└── packages/
    ├── db/             # Prisma schema + shared client
    ├── ui/             # Shared React component library
    ├── store/          # Recoil atoms (shared state)
    ├── eslint-config/
    └── typescript-config/
```

---

## ✨ Features

| Feature                 | Details                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Authentication**      | Phone + password (NextAuth v4 credentials) with custom branded sign-in/sign-up page |
| **Deposit (On-Ramp)**   | Initiate bank deposits via HDFC / Axis — confirmed by webhook                       |
| **P2P Transfer**        | Send money to any registered user by phone number                                   |
| **Transaction History** | Paginated, colour-coded table of all activity                                       |
| **Webhook Security**    | HMAC-SHA256 signature verification + express-rate-limit                             |
| **Env Validation**      | Zod schemas on every app — fail fast with clear errors                              |
| **Loading UX**          | Next.js `loading.tsx` skeletons on every route                                      |
| **Testing**             | 28 Vitest unit tests (webhook + server actions)                                     |
| **Docker**              | Multi-stage Dockerfiles + `docker-compose.yml`                                      |
| **CI/CD**               | GitHub Actions — lint → typecheck → test → build                                    |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- Docker Desktop (for the database)

### 1. Clone & install

```bash
git clone <repo-url>
cd paytm-project-starter-monorepo
npm install
```

### 2. Start PostgreSQL

```bash
docker run -d \
  --name paytm-postgres \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Set up environment variables

**`packages/db/.env`**

```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
```

**`apps/user-app/.env`**

```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
JWT_SECRET="your-jwt-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret-at-least-32-chars"
```

**`apps/bank-webhook/.env`**

```env
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb"
WEBHOOK_SECRET="your-webhook-secret-at-least-32-chars"
PORT=3003
```

### 4. Migrate database & seed test users

```bash
cd packages/db
npx prisma migrate deploy
npx prisma db seed
cd ../..
```

### 5. Run all apps

```bash
npm run dev
```

| App          | URL                   |
| ------------ | --------------------- |
| User App     | http://localhost:3001 |
| Bank Webhook | http://localhost:3003 |

### 6. Log in (test users from seed)

| Phone        | Password | Balance |
| ------------ | -------- | ------- |
| `1111111111` | `alice`  | ₹200.00 |
| `2222222222` | `bob`    | ₹20.00  |

---

## 🐳 Docker (one-command deployment)

```bash
# Copy env vars first
cp apps/user-app/.env.example apps/user-app/.env
# ... fill in the .env files

docker compose up --build
```

---

## 🧪 Testing

```bash
# All tests
npm run test

# Individual workspaces
npm run test --workspace=apps/bank-webhook
npm run test --workspace=apps/user-app

# With coverage
npm run test:coverage --workspace=apps/bank-webhook
```

---

## 🔐 Webhook Testing (curl)

```bash
# Generate a valid signature
SECRET="your-webhook-secret-at-least-32-chars"
PAYLOAD='{"token":"test-token","userId":"1","amount":10000}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:3003/hdfcwebhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$PAYLOAD"
```

---

## 📁 Key Files

| File                               | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `turbo.json`                       | Turborepo pipeline (build → test order) |
| `docker-compose.yml`               | Local full-stack deployment             |
| `.github/workflows/ci.yml`         | CI pipeline                             |
| `packages/db/prisma/schema.prisma` | Database schema                         |
| `apps/user-app/app/lib/auth.ts`    | NextAuth configuration                  |
| `apps/bank-webhook/src/app.ts`     | Webhook handler logic                   |
