import { AggregateProp, DomainAccess, newDatabaseId, TenantAggregateRoot } from '@joyb-works/nestjs-futkaey';

export class CardModel extends TenantAggregateRoot {
  @AggregateProp() lastFour!: string;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { lastFour: string }) {
    this.access = DomainAccess.Create;
    this.id = newDatabaseId().toString();
    this.lastFour = payload.lastFour;
    return this;
  }
}
