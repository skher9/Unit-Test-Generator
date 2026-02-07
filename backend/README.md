# Backend – Unit Test Generator API

NestJS REST API with Prisma, PostgreSQL, and JWT authentication.

## Folder structure

```
backend/
├── prisma/
│   ├── schema.prisma          # User & Generation models
│   └── migrations/            # SQL migrations
├── src/
│   ├── main.ts                # Bootstrap, ValidationPipe, CORS
│   ├── app.module.ts          # Root module, ConfigModule
│   ├── prisma/
│   │   ├── prisma.module.ts   # Global Prisma module
│   │   └── prisma.service.ts  # PrismaClient wrapper
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts # POST /auth/register, POST /auth/login
│   │   ├── auth.service.ts    # Register, login, bcrypt, JWT
│   │   ├── dto/               # register.dto, login.dto
│   │   ├── strategies/        # JWT strategy (passport)
│   │   ├── guards/            # JwtAuthGuard
│   │   └── decorators/        # CurrentUser
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts # GET /users/me (protected)
│   │   └── users.service.ts
│   ├── generations/
│   │   ├── generations.module.ts
│   │   ├── generations.controller.ts # POST/GET /generations (protected)
│   │   ├── generations.service.ts
│   │   └── dto/               # create-generation.dto
│   └── ai/
│       ├── ai.module.ts
│       └── ai.service.ts       # OpenAI test generation (optional)
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## How to run locally

### 1. Prerequisites

- Node.js (LTS)
- PostgreSQL running locally or a connection string

### 2. Environment

Copy the example env and set your values:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `DATABASE_URL` – e.g. `postgresql://USER:PASSWORD@localhost:5432/unit_test_generator?schema=public`
- `JWT_SECRET` – strong secret for signing JWTs
- Optionally `OPENAI_API_KEY` and `OPENAI_MODEL` for AI test generation

### 3. Install and database

```bash
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev --name init
npx prisma generate         # if you changed schema
```

### 4. Start the server

```bash
npm run start:dev
```

API base: **http://localhost:3000** (or the `PORT` in `.env`).

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register (body: email, password, name?) |
| POST | `/auth/login` | No | Login (body: email, password) → `{ accessToken, user }` |
| GET | `/users/me` | Bearer | Current user profile |
| POST | `/generations` | Bearer | Create generation (body: inputCode) |
| GET | `/generations` | Bearer | List current user’s generations |
| GET | `/generations/:id` | Bearer | Get one generation by id |

Protected routes require header: `Authorization: Bearer <accessToken>`.

## Design notes

- **Thin controllers**: Only parse request and call services; no business logic.
- **Logic in services**: Auth, users, and generations logic lives in services.
- **DTOs**: Request bodies validated with `class-validator`; `ValidationPipe` is global.
- **Secrets**: Passwords hashed with bcrypt; JWT and DB config from env; no secrets in code.
- **Prisma**: All DB access via `PrismaService`; schema and migrations in `prisma/`.
