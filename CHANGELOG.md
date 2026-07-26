# Changelog 📝

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-07-16

### Added

- Reorganized documentation directories to follow clean enterprise categories (`00-overview` through `09-diagrams`).
- Restructured `README.md` into an interactive landing portal.
- Added release changelog tracker.

## [0.1.1] - 2026-07-14

### Added

- Installed `@nestjs/terminus` health indicators.
- Created `PrismaHealthIndicator` database checks.
- Created `RedisHealthIndicator` cache checks.
- Added liveness and readiness probe routes.
- Configured E2E testing framework with mocked database and cache providers.

## [0.1.0] - 2026-07-12

### Added

- Monorepo package workspace configuration with NestJS and Next.js applications.
- Configured global exceptions and interceptors wrappers.
- Integrated Prisma and Redis database clients.
