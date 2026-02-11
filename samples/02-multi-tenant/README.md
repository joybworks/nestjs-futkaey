# Sample 02: Multi-Tenant (companyId)

Multi-tenant application scoped by `companyId`. Use when:

- Each company has isolated data
- Requests include `x-company-id`
- You need automatic tenant filtering

## Configuration

```typescript
NestjsFutkaeyModule.forRoot({
  tenancy: {
    mode: 'multi-tenant',
    tenant: {
      fieldName: 'companyId',
      headerName: 'x-company-id',
    },
  },
  audit: { userIdHeader: 'x-user-id' },
})
```

Requires `nestjs-cls` for context storage.

## What it demonstrates

- `TenantAggregateRoot` with `companyId` from context
- `@TenantAware()` on entities
- `RepositoryMixin` — all queries filtered by `companyId`
- Saves automatically inject `companyId`

## Structure

```
├── src/
│   ├── app.module.ts
│   ├── order/
│   │   ├── order.entity.ts    # @TenantAware, companyId column
│   │   ├── order.model.ts     # extends TenantAggregateRoot
│   │   ├── order.repository.ts
│   │   └── order.controller.ts
│   └── ...
```

## Run

```bash
npm install
npm run start:dev
```

Try:

```bash
# Create order for company A
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "x-company-id: company-a" \
  -H "x-user-id: user-1" \
  -d '{"total":100}'

# List orders for company A (only company A's data)
curl http://localhost:3000/orders -H "x-company-id: company-a"

# List orders for company B (different data)
curl http://localhost:3000/orders -H "x-company-id: company-b"
```
