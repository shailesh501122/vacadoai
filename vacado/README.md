# Vacado — YouTube Shorts Automation SaaS

Turn any movie into a viral YouTube Short, fully automated: AI script → neural
voiceover → clip composition → thumbnail → scheduled YouTube upload.

Built from the Claude Design handoff bundle — the landing page and dashboard are
recreated pixel-for-pixel in React (Poppins, YouTube‑red `#FF0000` theme).

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue    | BullMQ + Redis |
| Auth     | JWT + bcrypt, Google OAuth2 (ID token + YouTube channel OAuth) |
| Storage  | AWS S3 / Cloudflare R2 |
| Payments | Stripe (subscriptions + webhooks) |
| AI       | OpenAI GPT‑4o + DALL·E 3, ElevenLabs TTS |
| Video    | ffmpeg composition |
| Email    | Nodemailer + SendGrid |
| Frontend | React + Vite + TypeScript + Tailwind, Lucide icons, Chart.js |
| Infra    | Docker, docker-compose, Nginx reverse proxy |

## Project layout

```
vacado/
├── backend/      Express API + BullMQ worker (src/{config,controllers,middleware,
│                 routes,services,jobs,utils}, prisma/schema.prisma)
├── frontend/     React app (pages, components, hooks, api, styles)
├── nginx/        production reverse proxy
├── docker-compose.yml
└── .env.example
```

## Quick start (Docker — recommended)

```bash
cd vacado
cp .env.example .env          # fill in real secrets
docker compose up --build
```

- App (via Nginx): http://localhost  
- Frontend dev port: http://localhost:3000  
- API: http://localhost:4000/api/health

Migrations run automatically (`prisma migrate deploy`) when the backend boots.

### Seed a demo account

```bash
docker compose exec backend npx tsx prisma/seed.ts
# login: demo@vacado.app / demo1234  (Pro plan, sample Shorts)
```

## Local development (without Docker)

Prereqs: Node 20+, PostgreSQL, Redis, `ffmpeg` on PATH.

```bash
# Backend
cd backend
npm install
cp ../.env.example .env        # point DATABASE_URL/REDIS_URL at localhost
npx prisma migrate dev
npm run seed
npm run dev                    # API on :4000
npm run worker                 # BullMQ worker (separate terminal)

# Frontend
cd ../frontend
npm install
npm run dev                    # Vite on :3000, proxies /api → :4000
```

## API surface

```
AUTH           POST /api/auth/register · /login · /google/callback
               GET  /api/auth/me   POST /api/auth/logout
SHORTS         POST /api/shorts/generate (quota-checked, 10/min)
               GET  /api/shorts  GET/DELETE /api/shorts/:id
               POST /api/shorts/:id/publish · /:id/schedule
CHANNELS       GET /api/channels  POST /connect  GET /callback
               DELETE /:id  PATCH /:id/toggle
SUBSCRIPTIONS  GET /me  POST /checkout · /portal · /webhook (raw body)
ANALYTICS      GET /api/analytics/overview · /performance · /languages
API KEYS       GET/POST /api/api-keys  DELETE /:id   (Pro/Agency only)
HEALTH         GET /api/health
```

## Generation pipeline (`jobs/generateShort.ts`)

`script (GPT-4o)` → `voiceover (ElevenLabs) → S3` → `source clip` →
`compose (ffmpeg, 1080×1920, burnt subtitles) → S3` → `thumbnail (DALL·E) → S3`
→ optional `YouTube upload` → increment `shortsUsed`, email the user.
Failures mark the Short `FAILED`, log to the `jobs` table, and retry (3×, backoff).

## Plans & enforcement

| Plan | Price | Shorts/mo | Languages | Channels | API |
|------|-------|-----------|-----------|----------|-----|
| Starter | $29 | 30 | 5 | 1 | — |
| Pro | $79 | 150 | 25 | 5 | ✓ |
| Agency | $199 | unlimited | 50+ | 20 | ✓ priority queue |

`checkSubscriptionLimit` rejects generation past quota; Stripe webhooks
(`invoice.payment_succeeded`, `customer.subscription.{updated,deleted}`,
`invoice.payment_failed`) keep the local subscription row in sync and reset
monthly usage on renewal.

## Security / production notes

- Helmet, CORS locked to `APP_URL` in prod, rate limiting (100/min general,
  10/min generate, 20/15min auth).
- Zod validation on every mutating route; JWT in httpOnly cookie **or** Bearer;
  hashed API keys.
- Stripe webhook mounted with `express.raw` before the JSON parser and
  signature‑verified.
- Winston structured logs, `/api/health`, graceful SIGTERM shutdown.
- Bound the Prisma pool via `?connection_limit=` (or front Postgres with
  pgBouncer).

## Environment

See [`.env.example`](.env.example) for every required variable
(`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, Google/OpenAI/ElevenLabs/Stripe/S3/
SendGrid keys). Never commit `.env`.
