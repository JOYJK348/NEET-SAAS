# 🛠️ MVP Tech Stack Specification (Phase 1)

> **Document Type:** Architecture Standard  
> **Status:** 🟢 Decided & Locked  
> **Target Timeline:** 10 Weeks | Launch-ready MVP  
> **Author:** Architecture Review (15+ Years Architect Guideline)

---

## 📖 Executive Summary
The platform is a **multi-tenant coaching SaaS product** designed for live classes, mock tests, student progress tracking, automated billing, and parent portal access. The architecture is designed to support 1-2 coaching centers at launch and scale up to 5,00,000+ students and crores of rows without structural redesign.

---

## 🖥️ 1. Frontend Layer

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Next.js 14 (App Router)** | Client portals (Student, Tutor, Parent, Admin) | Server-Side Rendering (SSR) for fast loading, API routes, and seamless caching. |
| **Tailwind CSS** | Responsive styling | Utility-first utility classes, rapid development, and styling isolation. |
| **shadcn/ui** | Core UI components | High quality tables, calendars, dialogs, charts. Tailwind native, fully customizable. |
| **React Query (TanStack)** | API data fetching & synchronization | Automatic caching, background data refetching, and optimistic UI updates. |
| **Zustand** | Global client state management | Ultra-lightweight, zero boilerplate, fast react state management. |

---

## ⚙️ 2. Backend Layer

| Technology | Purpose | Why Chosen |
|---|---|---|
| **NestJS (TypeScript)** | API server & business logic | Enterprise-grade, modular, strict dependency injection, highly maintainable. |
| **Prisma ORM** | Database queries & migrations | Type-safe auto-generated queries, clean SQL migrations, and schema-first workflow. |
| **Supabase Auth + JWT** | Authentication & RBAC | Built-in role management, social login ready, secure JSON Web Token generation. |
| **Swagger/OpenAPI** | Live API documentation | Auto-generated endpoint docs, interactive schema testing for frontend devs. |
| **Class Validator / DTOs** | Input validation | Strict decorator-based schema validation at the HTTP input layer. |

---

## 🗄️ 3. Database & Storage Layer

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Supabase (PostgreSQL)** | Primary database engine | Relational storage, built-in connection pooler (PgBouncer), native RLS. |
| **Supabase Storage** | PDFs, photos (Study materials, profile documents) | Scoped by RLS policies, fast CDN delivery, built-in image optimization. |
| **Cloudflare R2** | Recorded video classes storage | Zero data egress fees, S3-compatible API, cost-effective storage (₹1.25/GB). |
| **Redis** | Session cache & rate limiter | High-speed memory store to prevent database queries overload. |

---

## 🎥 4. Video & Live Class Infrastructure

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Jitsi Meet (Self-hosted)** | Live classes, screen sharing | Open-source, full data control, supports 200+ concurrent students per node. |
| **DigitalOcean Droplet** | Jitsi server host | Flat-rate Droplet (~₹1,500/mo) with guaranteed resources and 99.9% uptime. |
| **FFmpeg** | Video compression (1080p → 720p) | Auto-compresses recordings (60% file size reduction) before copying to R2. |
| **Cloudflare Stream / CDN** | Global video playback | Buffer-free streaming, global edge distribution, video players watermarking. |
| **Auto-upload Daemon** | recording transfer | Scheduled cron jobs auto-pushes local droplet records to Cloudflare R2. |

---

## 💳 5. Payment Integration

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Razorpay Checkout** | Core payment gateway | optimized for India, supports UPI, local cards, net banking. |
| **Razorpay Subscriptions** | Recurring monthly fees | Auto-debits fees (monthly/quarterly) directly based on student enrollment. |
| **Webhooks** | Payment state synchronization | Auto-updates database status immediately upon successful transaction. |

---

## 🚀 6. Hosting & DevOps

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Vercel** | Frontend deployment | Auto-builds from GitHub, edge serverless execution, optimal Next.js support. |
| **Railway** | NestJS backend hosting | Zero-DevOps git-based deployments, cost-effective scaling (~₹500/mo). |
| **GitHub Actions** | CI/CD pipeline | Automatic code verification, unit tests execution, and deployment hooks. |
| **Sentry** | Error monitoring | Real-time crash alerts, stack traces, performance monitoring logs. |
| **UptimeRobot** | Health checks | Free ping monitor, instantly alerts via email/SMS if backend goes down. |
