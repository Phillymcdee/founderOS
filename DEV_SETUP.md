# Founder OS – Dev Setup (High Level)

This repository contains an implementation of the **agent-native operating system** described in `READMEv2.md`, using a modern but simple stack:

- **Runtime / framework**: Next.js (App Router) with TypeScript
- **Database (L0)**: PostgreSQL, accessed via Prisma
- **Agents (L1)**: TypeScript modules that call LLM APIs behind a small abstraction
- **Orchestrators (L2)**: TypeScript modules that sequence agents and write events
- **Intent (L3)**: Config stored in the database and/or environment
- **Interfaces (L4)**: Thin Next.js pages for the Founder dashboards

## Getting started

1. Install Node.js 18+ and PostgreSQL.
2. Create a database and set `DATABASE_URL` in your environment.
3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed demo data (one-time):

```bash
npx ts-node prisma/seed.ts
```

6. Start the dev server:

```bash
npm run dev
```

Then open the app in your browser and use:

- `/` – entry page
- `/founder/business` – Weekly Founder Summary (Minimal Slice)
- `/founder/ideas` – Ideas & Validation dashboard

> Postgres runs on `localhost:5433` via Docker Compose. If you restart your machine, run `docker compose up -d db` again before starting the dev server.

Use `READMEv2.md` as the high-level architecture guide; this file is only about running the implementation.


