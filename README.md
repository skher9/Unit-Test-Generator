# Unit Test Generator

A production-ready AI SaaS application that helps developers generate unit tests from their code. This repository is a **monorepo** containing the frontend and backend applications in a single Git repository.

---

## Project Overview

Unit Test Generator is an AI-powered SaaS platform that:

- Accepts source code and generates unit tests using AI (DeepSeek)
- Provides a clean, developer-focused web interface
- Secures access with JWT-based authentication
- Stores users, generations, and metadata in PostgreSQL

The system is designed for clarity, maintainability, and scalability, with a clear separation between the React frontend and the NestJS API.

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, React Router, Axios |
| **Backend**  | NestJS, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **AI**       | DeepSeek API (OpenAI-compatible) |
| **Auth**     | JWT-based authentication |

---

## Local Development

### Prerequisites

- **Node.js** (LTS, e.g. 18 or 20)
- **npm** (or pnpm / yarn)
- **PostgreSQL** (running locally or a hosted instance)
- **DeepSeek API key** (for test generation)

### Environment Variables

| Variable | Where | Required | Description |
|----------|--------|----------|-------------|
| `DATABASE_URL` | Backend | Yes | PostgreSQL connection string, e.g. `postgresql://USER:PASSWORD@localhost:5432/unit_test_generator?schema=public` |
| `JWT_SECRET` | Backend | Yes | Secret used to sign JWTs (use a long random string in production) |
| `JWT_EXPIRES_IN` | Backend | No | JWT expiry, default `7d` |
| `PORT` | Backend | No | API port, default `3000` |
| `CORS_ORIGIN` | Backend | No | Allowed frontend origin, e.g. `http://localhost:5173` |
| `AI_PROVIDER` | Backend | Yes | Set to `deepseek` (only supported provider) |
| `DEEPSEEK_API_KEY` | Backend | Yes for generation | DeepSeek API key for generating tests |
| `DEEPSEEK_MODEL` | Backend | No | Model name, default `deepseek-coder` |
| `VITE_API_URL` | Frontend | No | Backend URL; if unset, dev uses `/api` (proxied to backend) |

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, DEEPSEEK_API_KEY (and optionally PORT, CORS_ORIGIN, DEEPSEEK_MODEL)
npx prisma migrate deploy
npm run start:dev
```

API runs at **http://localhost:3000** (or the `PORT` you set).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Optional: set VITE_API_URL if the backend is not at http://localhost:3000
npm run dev
```

App runs at **http://localhost:5173**. In dev, requests to `/api` are proxied to the backend (see `frontend/vite.config.ts`).

### Running Both

1. Start the backend first (and ensure PostgreSQL is running and migrations are applied).
2. Start the frontend in a second terminal.
3. Open http://localhost:5173, register or log in, then use the dashboard to generate tests.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Monorepo Root                            │
├─────────────────────────────┬───────────────────────────────────┤
│  /frontend                  │  /backend                         │
│  React SPA (Vite)           │  NestJS REST API                  │
│  - Auth (JWT in localStorage)│  - Auth module (login, register) │
│  - API client (Axios)        │  - Users, Generations, AI         │
│  - Login, Register, Dashboard│  - Prisma → PostgreSQL             │
└─────────────────────────────┴───────────────────────────────────┘
```

- **Frontend** (`/frontend`): Single-page application; login, register, dashboard (paste code, choose language, generate tests, view history). No business logic in UI.
- **Backend** (`/backend`): REST API for auth, user profile, and generations (calls OpenAI, stores results in PostgreSQL).

---

## Repository Structure

```
/
├── frontend/          # React app (Vite, Tailwind, React Router, Axios)
├── backend/           # NestJS API (Prisma, JWT, OpenAI)
├── README.md          # This file
└── .cursorrules       # Project-specific AI/editor rules
```

See `frontend/README.md` and `backend/README.md` for app-specific details.

---

## Future Features

- **Multiple test frameworks**: Jest, Vitest, pytest, etc.
- **Project context**: Use existing tests and project structure.
- **History & sharing**: Share test suites via links.
- **CI integration**: Export or webhook for GitHub Actions.
- **Billing & limits**: Usage-based billing and rate limits.
- **Team workspaces**: Organizations and shared history.

---

---

## Publishing to GitHub

Use these commands from the **repository root** to initialize Git and push to a new GitHub repo. Do not run `git init` again if the folder is already a Git repository.

```bash
# Initialize repository (only if not already a git repo)
git init

# Stage all files (respects .gitignore)
git add .

# First commit
git commit -m "Initial commit: Unit Test Generator monorepo (frontend + backend)"

# Create the repository on GitHub first (github.com → New repository), then add remote and push.
# Replace YOUR_USERNAME and YOUR_REPO with your GitHub username and repository name.

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

To use SSH instead of HTTPS for `origin`:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## License

Proprietary. All rights reserved.
