# 07 Deployment & Infrastructure Orchestration 🚀

Welcome to the **Deployment & Infrastructure Orchestration** category. This section outlines local environments setup, docker compose configuration, and SaaS hostings pipelines.

## 🛠️ Local Environment Boot

### Prerequisites

- Node.js >= 18
- pnpm >= 9.x
- Docker

### Steps

1. **Initialize Configs**:
   ```bash
   cp .env.example .env
   ```
2. **Launch Services**:
   Start PostgreSQL and Redis in docker:
   ```bash
   docker-compose up -d
   ```
3. **Database Setup**:
   Generate client and push local schema:
   ```bash
   pnpm --filter @neet/database db:generate
   pnpm --filter @neet/database db:push
   ```
4. **Boot Development API**:
   ```bash
   pnpm run dev
   ```

---

## Production Deployments

> [!NOTE]
>
> - **API Hosting**: Managed via **Railway** linked to repository branches.
> - **Frontend Hosting**: Deployed on **Vercel** with edge caching.
> - **Database Provisioning**: Supabase database clusters carrying transaction poolers.
> - **Asset Storage**: Cloudflare R2 partitions mapping file uploads.

---

[⬅️ Back to Main Documentation Index](../README.md)
