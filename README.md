# NestJS Futkaey

> **Pronunciation:** **FOO-t-keh** (Φούτ και — from Greek "Fut and").  
> *Fut* (φούτ) = "FOO-t" (the **t** is pronounced, not silent), *kai* (και) = "keh".

NestJS Futkaey is a library that brings **Domain-Driven Design (DDD)** patterns to NestJS applications backed by TypeORM. It provides configurable multi-tenancy, aggregate roots, repository abstractions, and dynamic entities—**dramatically reducing the infrastructure layer** so you can focus on domain logic.

## Why Futkaey?

In traditional DDD + NestJS setups, you spend significant effort building:

- Request context propagation (tenant, user, correlation ID)
- Tenant-scoped repository filters
- Domain ↔ persistence mapping
- Audit fields (createdBy, updatedBy, soft delete)
- Aggregate roots with event sourcing semantics

Futkaey provides all of this out of the box. Your **infrastructure layer becomes a thin integration**—you declare entities, domain models, and repositories; Futkaey handles context, tenancy, and marshalling.

### Core philosophy

1. **Domain first** — Your aggregates, entities, and value objects are the center. Persistence adapts to them.
2. **Configurable tenancy** — Tenancy is not hardcoded. Use `tenantId`, `companyId`, `customerId`, or any hierarchy you need.
3. **Infrastructure as composition** — Mix in repositories; no boilerplate for tenant scoping or marshalling.
4. **Request context** — Tenant, user, correlation ID flow through the request without passing them explicitly.

## Features

- **Configurable multi-tenancy** — Regular, single-tenant, or custom hierarchy (e.g. `tenantId` → `companyId` → `customerId`)
- **Dynamic tenant fields** — Use `tenantId`, `companyId`, `customerId`, or any field name you choose
- **Aggregate roots** — `BasicAggregateRoot` and `TenantAggregateRoot` with `@AggregateProp`, domain events, and context
- **Repository mixin** — `RepositoryMixin(Entity, Model)` for automatic tenant filtering and entity↔domain mapping
- **Dynamic entities** — Per-aggregate collections (e.g. `project_123_supply_data`) with `@DynamicEntity` and `DynamicRepository`
- **CQRS-ready** — Integrates with `@nestjs/cqrs`
- **Audit trail** — `createdBy`, `updatedBy`, `deletedBy`, soft delete
- **MongoDB & SQL** — Works with TypeORM drivers (MongoDB, PostgreSQL, MySQL, etc.)

---

## Installation

```bash
npm install @joyb-works/nestjs-futkaey
```

Peer dependencies (install in your app):

```bash
npm install @nestjs/common @nestjs/core @nestjs/typeorm typeorm reflect-metadata
# For multi-tenant mode:
npm install nestjs-cls
# Optional, for CQRS:
npm install @nestjs/cqrs
```

---

## Quick Start

### 1. Configure the module

```typescript
import { Module } from '@nestjs/common';
import { NestjsFutkaeyModule, setModuleOptions } from '@joyb-works/nestjs-futkaey';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configure tenancy before the app boots (e.g. in main.ts or a root module)
setModuleOptions({
  tenancy: {
    mode: 'multi-tenant',
    tenant: {
      fieldName: 'companyId',      // Your tenant field name
      headerName: 'x-company-id',  // HTTP header to read tenant from
    },
  },
  audit: {
    userIdHeader: 'x-user-id',
    correlationIdHeader: 'x-correlation-id',
    enableSoftDelete: true,
  },
});

@Module({
  imports: [
    NestjsFutkaeyModule.forRoot({
      tenancy: { mode: 'multi-tenant', tenant: { fieldName: 'companyId', headerName: 'x-company-id' } },
      audit: { userIdHeader: 'x-user-id' },
    }),
    TypeOrmModule.forRoot({ /* ... */ }),
  ],
})
export class AppModule {}
```

### 2. Tenant field names: `tenantId`, `companyId`, `customerId`

You can use **any** tenant field name. Examples:

| Use case               | `fieldName`  | `headerName`    |
|------------------------|--------------|-----------------|
| B2B SaaS (per company) | `companyId`  | `x-company-id`  |
| Multi-tenant platforms | `tenantId`   | `x-tenant-id`   |
| Customer-scoped data   | `customerId` | `x-customer-id` |
| Partner/white-label    | `partnerId`  | `x-partner-id`  |

Your entities declare the matching column:

```typescript
@Entity('orders')
@TenantAware()
export class OrderEntity extends AuditableEntity {
  @ObjectIdColumn() id: ObjectId;
  @Column() companyId: ObjectId;  // matches fieldName in config
  @Column() total: number;
}
```

### 3. Domain model (aggregate)

```typescript
import { BasicAggregateRoot, TenantAggregateRoot, AggregateProp, DomainAccess, newDatabaseId } from '@joyb-works/nestjs-futkaey';

// Non-tenant model (e.g. global lookup)
export class LookupModel extends BasicAggregateRoot {
  @AggregateProp() name!: string;
  @AggregateProp() code!: string;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { name: string; code: string }) {
    this.access = DomainAccess.Create;
    this.id = newDatabaseId().toString();
    this.name = payload.name;
    this.code = payload.code;
    this.apply(new LookupCreatedEvent(this.id, this.context, payload));
    return this;
  }
}

// Tenant-scoped model (has companyId, tenantId, etc. from config)
export class OrderModel extends TenantAggregateRoot {
  @AggregateProp() total!: number;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { total: number }) {
    this.access = DomainAccess.Create;
    this.id = newDatabaseId().toString();
    this.total = payload.total;
    this.apply(new OrderCreatedEvent(this.id, this.context, payload));
    return this;
  }
}
```

### 4. Repository

```typescript
import { RepositoryMixin } from '@joyb-works/nestjs-futkaey';
import { Injectable } from '@nestjs/common';
import { OrderEntity, OrderModel } from './domain';

const Base = RepositoryMixin(OrderEntity, OrderModel);

@Injectable()
export class OrderRepository extends Base {}
```

All `find`, `findOne`, `save`, `update` calls automatically filter by tenant and inject tenant/user context.

---

## Tenancy modes

### Regular (no tenancy)

```typescript
tenancy: { mode: 'regular' }
```

No tenant filtering. Use for single-tenant or non-multi-tenant apps.

### Multi-tenant (single level)

```typescript
tenancy: {
  mode: 'multi-tenant',
  tenant: {
    fieldName: 'companyId',
    headerName: 'x-company-id',
  },
}
```

One tenant field. HTTP requests must include `x-company-id` (or your header).

### Custom hierarchy (multiple levels)

```typescript
tenancy: {
  mode: 'custom-hierarchy',
  hierarchy: [
    { fieldName: 'tenantId', headerName: 'x-tenant-id' },
    { fieldName: 'companyId', headerName: 'x-company-id' },
    { fieldName: 'customerId', headerName: 'x-customer-id' },
  ],
}
```

Multiple context levels. Entities can declare any of these columns; Futkaey filters and injects them automatically.

### Custom hierarchy with required/optional levels

```typescript
tenancy: {
  mode: 'custom-hierarchy',
  hierarchy: [
    { fieldName: 'tenantId', headerName: 'x-tenant-id', required: true },
    { fieldName: 'companyId', headerName: 'x-company-id', required: true },
    { fieldName: 'customerId', headerName: 'x-customer-id', required: false },
  ],
}

// Entity can use any of these
@Entity('invoices')
@TenantAware()
export class InvoiceEntity extends AuditableEntity {
  @ObjectIdColumn() id: ObjectId;
  @Column() tenantId: ObjectId;
  @Column() companyId: ObjectId;
  @Column() customerId?: ObjectId;
  @Column() amount: number;
}
```

Headers are read in order. All levels are available in `context.tenantContext` for filtering and injection.

### Reading context programmatically

```typescript
import { getContextValue } from '@joyb-works/nestjs-futkaey';

const companyId = getContextValue('x-company-id');
const tenantId = getContextValue('x-tenant-id');
```

Use `getContextValue` when you need tenant/user values outside of repository or aggregate flows.

---

## DDD and infrastructure omission

In a typical DDD layering:

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation (Controllers, DTOs)                            │
├──────────────────────────────────────────────────────────────┤
│  Application (Commands, Queries, Handlers)                   │
├──────────────────────────────────────────────────────────────┤
│  Domain (Aggregates, Entities, Value Objects)                │
├──────────────────────────────────────────────────────────────┘
│  Infrastructure (Repositories, Persistence Adapters)  ← Futkaey drastically reduces this layer
└───────────────────────────────────────────────────────────────
```

With Futkaey:

- **Context propagation** — Tenant, user, correlation ID flow automatically via CLS
- **Tenant filtering** — Repositories add `WHERE tenantId = ?` (or equivalent) without you writing it
- **Entity ↔ Domain mapping** — `MarshallerMixin` handles TypeORM entities ↔ domain models
- **Audit fields** — `createdBy`, `updatedBy` set from request context

Your infrastructure becomes: declare the entity, declare the model, mix in the repository. No custom repository logic for tenancy or marshalling.

| Concern             | Without Futkaey                 | With Futkaey                  |
|---------------------|---------------------------------|-------------------------------|
| Request context     | Custom middleware + CLS         | Built-in `ContextMiddleware`  |
| Tenant filtering    | Manual `WHERE` in every query   | Automatic via `contextualize` |
| Audit fields        | Manual `createdBy`, `updatedBy` | Set from context on save      |
| Entity ↔ Domain map | Manual mapping in repositories  | `MarshallerMixin` handles it  |
| Tenant injection    | Manual before save              | Automatic on create/update    |

---

## Dynamic entities

For per-aggregate collections (e.g. `project_123_supply_data`):

```typescript
@DynamicEntity({
  collectionNameGenerator: (projectId) => `project_${projectId}_supply`,
  idField: 'projectId',
})
export class ProjectSupplyEntity extends AuditableEntity {
  @Column() projectId: ObjectId;
  @Column() name: string;
  // ...
}
```

Use `DynamicRepository` with the entity class and aggregate ID to read/write. The collection name is computed at runtime.

---

## Samples

See the [`samples/`](./samples/) directory for full NestJS examples:

- **samples/01-basic** — Regular mode, single tenant
- **samples/02-multi-tenant** — Multi-tenant with `companyId`
- **samples/03-custom-hierarchy** — `tenantId` → `companyId` → `customerId`
- **samples/04-dynamic-entities** — Per-aggregate collections

---

## API reference

| Export                | Description                             |
|-----------------------|-----------------------------------------|
| `NestjsFutkaeyModule` | NestJS module                           |
| `BasicAggregateRoot`  | Non-tenant aggregate root               |
| `TenantAggregateRoot` | Tenant-scoped aggregate root            |
| `AggregateProp`       | Marks domain properties for marshalling |
| `RepositoryMixin`     | Repository with tenant + marshalling    |
| `AppRepository`       | Repository interface type               |
| `DynamicEntity`       | Per-aggregate collection decorator      |
| `DynamicRepository`   | Repository for dynamic entities         |
| `TenantAware`         | Marks entity as tenant-aware            |
| `setModuleOptions`    | Set tenancy/audit config imperatively   |
| `getContextValue`     | Read value from CLS (e.g. tenant, user) |

---

## Release process

Futkaey uses [standard-version](https://github.com/conventional-changelog/standard-version) and [Commitlint](https://commitlint.js.org/) for versioning and changelog.

### Conventional commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Examples: `feat(repository): add findByIds`, `fix(aggregate): correct tenant context`

### Local release

```bash
npm run release        # Bump version, update CHANGELOG, create tag
npm run release:first  # First release (no previous tag)
```

### CI/CD

On merge to `main`: **CI** (`ci.yml`) runs lint/build/test; **Release** (`release-pr.yml`) runs `standard-version`, pushes tag, publishes to npm.

**Requirements:** Add `NPM_TOKEN` as repository secret for publishing. For the initial release (no tags yet), the workflow runs `standard-version --first-release` to create `v0.0.1`.

---

## License

MIT
