# Frontend – Unit Test Generator

React SPA (Vite + TypeScript + Tailwind + React Router + Axios).

## Setup

```bash
npm install
cp .env.example .env   # optional: set VITE_API_URL if backend is elsewhere
npm run dev
```

Runs at [http://localhost:5173](http://localhost:5173). In dev, API calls to `/api` are proxied to `http://localhost:3000` (see `vite.config.ts`).

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run preview` – preview production build

## Connecting to the backend

- **Base URL**: `VITE_API_URL` in `.env`; if unset, the app uses `/api` (proxied to the backend in dev).
- **Auth**: After login/register, the JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every request. A 401 response clears the token and redirects to `/login`.
- **Routes**: Login and Register are public; Dashboard is protected and requires a valid JWT.
