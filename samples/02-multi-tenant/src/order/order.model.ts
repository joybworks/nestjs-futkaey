import { AggregateProp, DomainAccess, TenantAggregateRoot } from '@joyb-works/nestjs-futkaey';

export class OrderModel extends TenantAggregateRoot {
  @AggregateProp() total!: number;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { total: number }) {
    this.access = DomainAccess.Create;
    this.id = crypto.randomUUID();
    this.total = payload.total;
    return this;
  }
}
