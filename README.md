# DevTrace — API Monitoring & Log Explorer

DevTrace is a full-stack SaaS platform for monitoring REST APIs: uptime tracking, latency history, searchable logs, and failure alerts.

## Architecture

```
                         ┌─────────────┐
   Browser  ───────────► │   Frontend   │  React + Vite + TS, served from S3/CloudFront
                         └──────┬──────┘
                                │ REST (JWT)
                                ▼
                         ┌─────────────┐        ┌───────────┐
                         │   Backend    │◄──────►│   Redis    │  dashboard cache
                         │ Express + TS │        └───────────┘
                         └──────┬──────┘
                                │                ┌───────────────┐
                                ├───────────────►│  MongoDB Atlas │  users, endpoints, logs, alerts
                                │                └───────────────┘
                                │                ┌───────────────┐
                                ├───────────────►│  OpenSearch    │  full-text log search
                                │                └───────────────┘
                                │
                                ▼
                         ┌─────────────┐   BullMQ queue (Redis)
                         │    Worker    │◄───────────────────────┐
                         │ health-check │                        │
                         │ + CSV export │───► S3 (export files)  │
                         └──────┬──────┘                         │
                                │                                │
                                ▼                                │
                         Nodemailer (SMTP) ──► alert emails ─────┘
```

The API and the worker are **separate processes** that share the same MongoDB, Redis, and OpenSearch instances. The worker polls active endpoints on a tick loop, respecting each endpoint's own monitoring interval, and is what actually generates the data the dashboard and log explorer show.

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, React Query, Recharts, Axios |
| Backend | Node.js, Express, TypeScript, Mongoose, JWT, bcrypt, Zod validation |
| Background jobs | BullMQ + Redis |
| Database | MongoDB Atlas (free tier) |
| Search | OpenSearch |
| Cache | Redis |
| Infra | Docker, Docker Compose |
| Cloud | AWS EC2 (API + worker), S3 (frontend hosting + CSV exports), CloudWatch (logs/metrics), IAM |

## Folder structure

```
devtrace/
  backend/
    src/
      config/       Mongo, Redis, OpenSearch clients
      models/        Mongoose schemas: User, Endpoint, HealthLog, Alert
      middleware/     JWT auth guard, centralized error handler
      controllers/    Route logic
      routes/         Express routers
      utils/          JWT signing, asyncHandler, ApiError
      app.ts / server.ts
    worker/
      index.ts        Worker entry point (tick loop + export worker)
      healthCheckJob.ts  Pings due endpoints, logs results, raises alerts
      exportJob.ts     BullMQ processor: generates CSV, uploads to S3
      mailer.ts        Nodemailer alert emails
  frontend/
    src/
      pages/          Landing, Login, Register, Dashboard, Endpoints, Logs, Alerts, Profile
      components/      Sidebar, AppLayout, KpiCard, ProtectedRoute
      context/         AuthContext
      api/             Axios client with auth interceptor
  deploy/aws/         Nginx config, PM2 ecosystem file, EC2 setup script,
                       CloudWatch agent config, IAM policy, S3 deploy script
  docker-compose.yml  redis + opensearch + backend + worker
```

## Local setup

### Prerequisites
- Node.js 20+
- Docker (for Redis + OpenSearch) — or install them natively
- A MongoDB Atlas free-tier cluster (or local MongoDB)

### 1. Start Redis + OpenSearch
```bash
docker compose up redis opensearch -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: MONGO_URI, JWT_SECRET at minimum
npm install
npm run dev          # API on http://localhost:4000
```

In a second terminal:
```bash
cd backend
npm run worker:dev   # starts the health-check + CSV export worker
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
```

Register an account, add an endpoint (any public URL works, e.g. `https://httpbin.org/status/200`), and within ~15–60 seconds the worker will start logging checks.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list. Never commit a real `.env` file — `.gitignore` already excludes it.

## Docker commands

```bash
# Full backend stack (redis, opensearch, backend, worker)
docker compose up --build

# Just infra, running the API/worker locally with ts-node for faster iteration
docker compose up redis opensearch -d
```

## AWS deployment

This repo includes deployment scaffolding under `deploy/aws/`, written against a standard "EC2 for the API + worker, S3 for the static frontend" setup:

- `ec2-setup.sh` — provisions Node, PM2, and Nginx on a fresh Ubuntu EC2 instance and starts the API + worker
- `ecosystem.config.js` — PM2 process definitions for `devtrace-api` and `devtrace-worker`
- `nginx.conf` — reverse proxy from port 80 to the Node API on port 4000
- `s3-deploy.sh` — builds the frontend and syncs it to an S3 static-hosting bucket
- `cloudwatch-agent-config.json` — ships PM2 logs and basic host metrics to CloudWatch
- `iam-policy.json` — example least-privilege policy for the EC2 instance role (S3 export/frontend buckets + CloudWatch)

**Note on this deployment tooling:** the scripts and configs are written to the AWS free tier as specified, but I haven't been able to run them against a live AWS account in this environment, so treat them as a solid starting point to test and adjust rather than a verified-working pipeline. Same goes for the OpenSearch and S3 integration code in `backend/` — the logic is real and follows each service's documented API, but wasn't tested against live OpenSearch/S3 endpoints here (only against the local Docker OpenSearch container's expected behavior).

## Screenshots

_Add screenshots here after running the app locally:_
- `docs/screenshots/dashboard.png`
- `docs/screenshots/endpoints.png`
- `docs/screenshots/log-explorer.png`
- `docs/screenshots/alerts.png`

## License

MIT
