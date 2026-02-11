# NestJS Futkaey Samples

This directory contains sample NestJS applications demonstrating Futkaey usage.

| Sample                                       | Description                                               |
|----------------------------------------------|-----------------------------------------------------------|
| [01-basic](./01-basic)                       | Regular mode — no tenancy, single-tenant app              |
| [02-multi-tenant](./02-multi-tenant)         | Multi-tenant with `companyId`                             |
| [03-custom-hierarchy](./03-custom-hierarchy) | Custom hierarchy: `tenantId` → `companyId` → `customerId` |
| [04-dynamic-entities](./04-dynamic-entities) | Dynamic entities for per-aggregate collections            |

## Running a sample

```bash
cd samples/01-basic
npm install
npm run start:dev
```

## Shared concepts

All samples illustrate:

- **Module configuration** — `NestjsFutkaeyModule.forRoot(...)` with tenancy and audit
- **Domain models** — `BasicAggregateRoot` or `TenantAggregateRoot` with `@AggregateProp`
- **Repositories** — `RepositoryMixin(Entity, Model)` for automatic tenant handling
- **Controllers** — Passing headers (`x-company-id`, `x-tenant-id`, etc.) for context

See the main [README](../README.md) for concepts, tenancy, and deeper explanation.
