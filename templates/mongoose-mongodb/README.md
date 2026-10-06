# Mongoose MongoDB Template

A TypeScript Express 5 API server template using **Mongoose 9** (an elegant MongoDB ODM for Node.js) with MongoDB.

## Stack

| Area       | Package                                               |
| ---------- | ----------------------------------------------------- |
| Runtime    | Node.js 20+ (Express 5)                               |
| ODM        | Mongoose 9 (MongoDB Node.js driver 7)                 |
| Validation | Zod 4 (request DTOs + environment variables)          |
| Auth       | JWT (`jsonwebtoken`) + `bcryptjs`, HttpOnly cookie    |
| DI         | `tsyringe`                                            |
| Logging    | `pino` + `pino-pretty` / `pino-roll`                  |
| Security   | `helmet`, `hpp`, `cors`, `express-rate-limit`         |
| Testing    | `mongodb-memory-server` (in-memory MongoDB for tests) |

## 🚀 Quick start

### 1. Environment

```bash
cp .env.example .env   # the CLI does this for you
pnpm install
```

### 2. Start MongoDB

```bash
# With the docker devtool selected
docker compose up mongo -d

# Or any MongoDB 7+/8 instance / MongoDB Atlas:
# MONGODB_URL=mongodb+srv://<user>:<pass>@cluster0.example.mongodb.net/mongoose_db
```

> When running the app itself inside docker compose, point `MONGODB_URL` at the `mongo`
> service host instead of `localhost`, e.g.
> `mongodb://admin:password@mongo:27017/mongoose_db?authSource=admin`.

### 3. Seed data (optional)

```bash
pnpm db:seed      # creates admin@example.com / user@example.com / inactive@example.com
```

### 4. Run

```bash
pnpm dev                 # tsx + nodemon hot reload
pnpm build && pnpm start # production build (tsc + tsc-alias)
```

## 📜 Scripts

| Script            | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `pnpm dev`        | Start the dev server with hot reload                            |
| `pnpm build`      | Compile to `dist/` and rewrite path aliases                     |
| `pnpm start`      | Run the compiled server with `NODE_ENV=production`              |
| `pnpm check`      | Type-check without emitting                                     |
| `pnpm db:seed`    | Insert sample users (skipped if users already exist)            |
| `pnpm db:reset`   | Drop the current database (refuses to run in production)        |
| `pnpm db:indexes` | Sync schema indexes (use on deploy; `autoIndex` is off in prod) |

## 🌐 API

Base path: `/api/v1`

| Method | Path           | Auth | Description                                        |
| ------ | -------------- | ---- | -------------------------------------------------- |
| GET    | `/health`      |      | Liveness + MongoDB connection status (no prefix)   |
| POST   | `/auth/signup` |      | Register `{ email, password }`                     |
| POST   | `/auth/login`  |      | Login, sets `Authorization` HttpOnly cookie        |
| POST   | `/auth/logout` | ✅   | Logout (cookie or `Authorization: Bearer <token>`) |
| GET    | `/users`       |      | List users; supports `?page=&limit=&search=`       |
| GET    | `/users/:id`   |      | Get user by ObjectId                               |
| POST   | `/users`       |      | Create user                                        |
| PUT    | `/users/:id`   |      | Partial update (password is re-hashed)             |
| DELETE | `/users/:id`   |      | Delete user (`204 No Content`)                     |

Users are returned as `{ id, email, firstName, lastName, isActive, createdAt, updatedAt }` —
`_id` is mapped to `id` and the password is never returned.

## 🗂 Structure

```bash
src/
├── config/          # env (zod), database connection, DI container, seed/reset/index scripts
├── controllers/     # HTTP handlers
├── dtos/            # zod request schemas
├── exceptions/      # HttpException
├── interfaces/      # domain types (User, UserResponse ...)
├── middlewares/     # auth, validation, error (maps Mongoose errors), 404
├── models/          # Mongoose schemas & models
├── repositories/    # data access (Mongoose → domain objects)
├── routes/          # Express routers
├── services/        # business logic (DB agnostic)
├── utils/           # logger, hash, asyncHandler
├── app.ts
└── server.ts        # connects MongoDB, then starts HTTP server (graceful shutdown)
```

## 🍃 Mongoose notes

- **Schema → types**: `src/models/user.model.ts` uses `InferSchemaType`, so the document type
  follows the schema automatically.
- **Password safety**: `password` has `select: false`; only `findByEmailWithPassword` selects it.
- **Repository pattern**: repositories return plain domain objects (`lean()` + mapping), keeping
  services free of Mongoose types and easy to unit-test with an in-memory repository.
- **Error mapping**: `ValidationError` → 400, `CastError` → 400, duplicate key (`E11000`) → 409.
- **Indexes**: `autoIndex` is on in development/test and off in production — run `pnpm db:indexes`
  during deployment.
- **Search**: `?search=` uses a case-insensitive, regex-escaped match on email / first / last name.

## 🧪 Testing

When you pick **Jest** or **Vitest** in the CLI, Mongoose-specific tests are added under
`src/test`:

- `unit/` — pure unit tests (no database)
- `e2e/` — full HTTP tests with supertest against a real MongoDB

By default the e2e tests start an in-memory MongoDB via `mongodb-memory-server` (the binary is
downloaded on first run). To use an existing MongoDB instead (e.g. a CI service container or
when downloads are blocked), set `MONGODB_TEST_URL`:

```bash
MONGODB_TEST_URL=mongodb://127.0.0.1:27017/app_test pnpm test
```
