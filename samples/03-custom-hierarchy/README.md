# Sample 03: Custom Hierarchy (tenantId → companyId → customerId)

Multi-level tenancy for platforms with hierarchy. Use when:

- You have tenant → company → customer (or similar)
- Different entities scope at different levels
- Requests include multiple headers

## Configuration

```typescript
NestjsFutkaeyModule.forRoot({
  tenancy: {
    mode: 'custom-hierarchy',
    hierarchy: [
      { fieldName: 'tenantId', headerName: 'x-tenant-id' },
      { fieldName: 'companyId', headerName: 'x-company-id' },
      { fieldName: 'customerId', headerName: 'x-customer-id' },
    ],
  },
  audit: { userIdHeader: 'x-user-id' },
})
```

## What it demonstrates

- `TenantAggregateRoot` with all hierarchy fields populated
- Entities can declare `tenantId`, `companyId`, and/or `customerId`
- Queries filter by all declared columns
- `context.tenantContext` contains all levels

## Structure

```
├── package.json
├── nest-cli.json
├── tsconfig.json
├── src/
│   ├── app.module.ts      # Futkaey forRoot(custom-hierarchy), TypeORM SQLite
│   ├── main.ts
│   └── invoice/
│       ├── invoice.module.ts
│       ├── invoice.entity.ts   # @TenantAware(), tenantId, companyId, customerId
│       ├── invoice.model.ts    # TenantAggregateRoot, create({ amount })
│       ├── invoice.repository.ts # RepositoryMixin(InvoiceEntity, InvoiceModel)
│       └── invoice.controller.ts  # POST /invoices, GET /invoices
```

## Run

```bash
npm install
npm run start:dev
```

Try:

```bash
# Create invoice (all hierarchy headers)
curl -X POST http://localhost:3000/invoices \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-1" \
  -H "x-company-id: company-a" \
  -H "x-customer-id: customer-123" \
  -H "x-user-id: user-1" \
  -d '{"amount":500}'

# List invoices (filtered by tenant/company/customer from headers)
curl http://localhost:3000/invoices \
  -H "x-tenant-id: tenant-1" \
  -H "x-company-id: company-a" \
  -H "x-customer-id: customer-123"
```
