# @repo/db

Shared database package for the PayFlow monorepo. This package centralizes the Prisma schema, client initialization, and seed data.

## 🛠️ Usage

### ⚙️ Environment Variables

Create a `.env` file in this directory with the following:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

### 📜 Scripts

- `npx prisma generate`: Regenerates the Prisma client.
- `npx prisma migrate dev`: Creates a new migration and updates the database.
- `npx prisma studio`: Opens a GUI to browse your database.
- `npm run seed`: Runs the seeding script defined in `package.json`.

## 🗃️ Schema Overview

- `User`: Core user model with phone and hashed password.
- `Balance`: Tracks user balance and locked funds.
- `OnRampTransaction`: Tracks money coming into the wallet from banks.
- `P2PTransfer`: Records peer-to-peer transfers between users.

## 🔌 Using in other packages

Import the client directly:

```typescript
import db from "@repo/db/client";
```
