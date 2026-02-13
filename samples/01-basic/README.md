# Sample 01: Basic (Regular Mode)

Single-tenant application with **no** multi-tenancy. Use when:

- You have one logical tenant
- You don't need tenant isolation
- You want minimal configuration

## Configuration

```typescript
NestjsFutkaeyModule.forRoot({
  tenancy: { mode: 'regular' },
  audit: { userIdHeader: 'x-user-id' },
})
```

No `nestjs-cls` required. No tenant headers.

## What it demonstrates

- `BasicAggregateRoot` for domain models
- `RepositoryMixin` for entity ↔ domain mapping
- Audit fields (`createdBy`, `updatedBy`) from request context
- No tenant filtering (all data visible)

## Structure

```
├── package.json
├── nest-cli.json
├── tsconfig.json
├── src/
│   ├── app.module.ts      # Futkaey forRoot(regular), TypeORM SQLite
│   ├── main.ts
│   └── lookup/
│       ├── lookup.module.ts
│       ├── lookup.entity.ts    # AuditableEntity, no @TenantAware
│       ├── lookup.model.ts      # BasicAggregateRoot, create(payload)
│       ├── lookup.repository.ts # RepositoryMixin(LookupEntity, LookupModel)
│       └── lookup.controller.ts # POST /lookup, GET /lookup
```

## Run

```bash
npm install
npm run start:dev
```

Try:

```bash
# Create a lookup (no tenant header)
curl -X POST http://localhost:3000/lookup \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{"name":"Status","code":"active"}'

# List all lookups
curl http://localhost:3000/lookup
```
