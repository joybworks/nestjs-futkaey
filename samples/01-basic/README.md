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
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── lookup/
│   │   ├── lookup.entity.ts
│   │   ├── lookup.model.ts
│   │   ├── lookup.repository.ts
│   │   └── lookup.controller.ts
│   └── ...
```

## Run

```bash
npm install
npm run start:dev
```

Try:

```bash
curl -X POST http://localhost:3000/lookup \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{"name":"Status","code":"active"}'
```
