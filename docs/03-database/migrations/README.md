# Safe Database Migrations Strategy 🔄

## Deployment Pipeline

1. **Local Validation**: Run `pnpm db:migrate` locally.
2. **Review Check**: All schema expansions must be additive. Avoid breaking changes (e.g. dropping columns or changing column types) in a single release.
3. **Deploy Phase**: Runs automatically in CI/CD pipeline before the API servers launch.

---

[⬅️ Back to Database Index](../README.md)
