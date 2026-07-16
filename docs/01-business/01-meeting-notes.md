# Meeting 01

## Date

July 6, 2026

## Attendees

- Client
- JK
- Bharathi

## Discussion Summary

- Discussed the overall vision of the Coaching Management Platform.
- Finalized the core technology stack.
- Decided to build the platform for a single institution initially, with future support for a multi-tenant SaaS model.
- Discussed AI integration, live classes, study materials, mock tests, and deployment strategy.

## Decisions Taken

- Institution-first approach.
- Future SaaS expansion.
- Frontend: Next.js.
- Backend: NestJS.
- PostgreSQL database.
- Railway deployment.
- Vercel deployment.
- Cloudflare R2 for storage.
- Jitsi for live classes.
- AI features in Phase 1.
- Manual paper evaluation by tutor.

## Pending Questions

- AI usage limits.
- Subscription pricing.

---

# Meeting 02

## Date

July 13, 2026

## Attendees

- JK
- Bharathi

## Discussion Summary

- Reviewed existing architecture documentation and database design.
- Finalized V1 MVP scope for NEET Coaching Management Platform.
- Defined the core principle: **Future-ready database, MVP-ready implementation.**
- All 200+ database tables will be kept. Only V1 features get APIs + UI.
- Defined manual evaluation flow (Tutor → Admin → Publish) as the V1 exam workflow.
- Previous Year Papers Store added as a new V1 feature (Browse → Pay → Unlock).
- Tenant Feature Flags concept introduced — every module toggleable from Tenant Admin UI.
- Google Calendar set to one-way sync only for V1.
- WhatsApp notifications deferred to V1.1.
- Decision: Build in this order → V1 Scope Freeze → Prisma Schema → NestJS APIs → Next.js UI.

## Decisions Taken

- **V1 Scope Freezed** — See [v1-scope-freeze.md](./v1-scope-freeze.md)
- Exam Flow: MCQ Auto-Eval + Manual Subjective Eval + Admin Approval + Publish
- Previous Year Papers: Paid feature (store in R2, purchase + unlock)
- Tenant Feature Flags: AI, Live Class, Mock Tests, Fees, Parent Portal, Calendar — all toggleable
- Google Calendar: One-way only (V1)
- WhatsApp: Deferred to V1.1
- Keep all 200+ database tables; implement only V1 APIs
- Prisma schema generation is the next technical step

## Pending

- Prisma schema generation
- NestJS project initialization
- Sprint 1 kickoff

## Next Steps

- ✅ V1 Scope Freeze Complete
- Generate Prisma schema from existing SQL
- Initialize NestJS backend
- Begin Sprint 1
