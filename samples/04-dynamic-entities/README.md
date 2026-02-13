# Sample 04: Dynamic Entities

Per-aggregate collections: a **cards** collection and, for each card, a dynamic **transactions** collection (e.g. `card_<creditcardId>_transactions`). Use when:

- One aggregate (card) has many child records (transactions)
- Collection name depends on the aggregate ID (`creditcardId`)
- You want to avoid huge single tables

## Configuration

Same as multi-tenant. Dynamic entities use `@DynamicEntity` with `creditcardId` and a collection name generator:

```typescript
@DynamicEntity({
  collectionNameGenerator: (creditcardId) => `card_${creditcardId}_transactions`,
  idField: 'creditcardId',
})
export class TransactionEntity extends AuditableEntity {
  @Column() creditcardId: ObjectId;
  @Column() amount: number;
  @Column() merchant: string;
  // ...
}
```

## What it demonstrates

- `@DynamicEntity` with `collectionNameGenerator` and `idField: 'creditcardId'`
- `DynamicRepository` — inject entity class and aggregate ID (creditcardId)
- Collection name computed at runtime per card (e.g. `card_abc123_transactions`)

## Structure

```
├── package.json          # mongodb dependency for ObjectId
├── nest-cli.json
├── tsconfig.json
├── src/
│   ├── app.module.ts     # Futkaey multi-tenant, TypeORM MongoDB
│   ├── main.ts
│   └── card/
│       ├── card.module.ts
│       ├── card.entity.ts           # @TenantAware(), cards collection
│       ├── card.model.ts            # TenantAggregateRoot
│       ├── card.repository.ts      # RepositoryMixin(CardEntity, CardModel)
│       ├── card.controller.ts      # CRUD cards + /cards/:cardId/transactions
│       ├── transaction.entity.ts   # @DynamicEntity(creditcardId), per-card collection
│       ├── transaction.model.ts    # BasicAggregateRoot, creditcardId + amount + merchant
│       └── transaction.repository.ts # DynamicRepositoryMixin(TransactionEntity, TransactionModel)
```

## Run

**Requires MongoDB** (local or set `MONGO_URI`).

```bash
npm install
npm run start:dev
```

Try:

```bash
# Create a card (returns id, e.g. 507f1f77bcf86cd799439011)
curl -X POST http://localhost:3000/cards \
  -H "Content-Type: application/json" \
  -H "x-company-id: company-a" \
  -H "x-user-id: user-1" \
  -d '{"lastFour":"4242"}'

# List cards
curl http://localhost:3000/cards -H "x-company-id: company-a"

# Add a transaction for a card (use a card id from above; writes to card_<id>_transactions)
curl -X POST "http://localhost:3000/cards/<CARD_ID>/transactions" \
  -H "Content-Type: application/json" \
  -H "x-company-id: company-a" \
  -d '{"amount":99.99,"merchant":"Store A"}'

# List transactions for that card (reads from card_<id>_transactions collection)
curl "http://localhost:3000/cards/<CARD_ID>/transactions" -H "x-company-id: company-a"
```
