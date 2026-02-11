# Sample 04: Dynamic Entities

Per-aggregate collections (e.g. `project_123_supply_data`). Use when:

- One aggregate has many child collections
- Collection name depends on aggregate ID
- You want to avoid huge tables

## Configuration

Same as multi-tenant. Dynamic entities use `@DynamicEntity`:

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

## What it demonstrates

- `@DynamicEntity` with `collectionNameGenerator`
- `DynamicRepository` — inject entity class and aggregate ID
- Collection name computed at runtime per project

## Structure

```
├── src/
│   ├── app.module.ts
│   ├── project/
│   │   ├── project.entity.ts
│   │   ├── project.model.ts
│   │   ├── project-supply.entity.ts   # @DynamicEntity
│   │   ├── project-supply.repository.ts
│   │   └── project-supply.controller.ts
│   └── ...
```

## Run

```bash
npm install
npm run start:dev
```

Try:

```bash
# Add supply data for project-123
curl -X POST "http://localhost:3000/projects/project-123/supply" \
  -H "Content-Type: application/json" \
  -H "x-company-id: company-a" \
  -d '{"name":"Candidate A","experience":5}'

# List supply for project-123 (reads from project_project-123_supply collection)
curl "http://localhost:3000/projects/project-123/supply" -H "x-company-id: company-a"
```
