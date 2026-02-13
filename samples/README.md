# NestJS Futkaey Samples

This directory contains sample NestJS applications demonstrating Futkaey usage.

| Sample                                       | Description                                               |
|----------------------------------------------|-----------------------------------------------------------|
| [01-basic](./01-basic)                       | Regular mode — no tenancy, single-tenant app              |
| [02-multi-tenant](./02-multi-tenant)         | Multi-tenant with `companyId`                             |
| [03-custom-hierarchy](./03-custom-hierarchy) | Custom hierarchy: `tenantId` → `companyId` → `customerId` |
| [04-dynamic-entities](./04-dynamic-entities) | Dynamic entities for per-aggregate collections            |

## Running a sample

Each sample is a standalone NestJS app. Install and run:

```bash
cd samples/01-basic   # or 02-multi-tenant, 03-custom-hierarchy, 04-dynamic-entities
npm install
npm run start:dev
```

- **01-basic**, **02-multi-tenant**, **03-custom-hierarchy** use SQLite (in-memory); no extra setup.
- **04-dynamic-entities** uses MongoDB; ensure MongoDB is running locally or set `MONGO_URI`.

## Shared concepts

All samples illustrate:

- **Module configuration** — `NestjsFutkaeyModule.forRoot(...)` with tenancy and audit
- **Domain models** — `BasicAggregateRoot` or `TenantAggregateRoot` with `@AggregateProp`
- **Repositories** — `RepositoryMixin(Entity, Model)` for automatic tenant handling
- **Controllers** — Passing headers (`x-company-id`, `x-tenant-id`, etc.) for context

See the main [README](../README.md) for concepts, tenancy, and deeper explanation.
