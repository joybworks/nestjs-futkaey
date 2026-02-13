import { AggregateProp, DomainAccess, TenantAggregateRoot } from '@joyb-works/nestjs-futkaey';

export class InvoiceModel extends TenantAggregateRoot {
  @AggregateProp() amount!: number;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { amount: number }) {
    this.access = DomainAccess.Create;
    this.id = crypto.randomUUID();
    this.amount = payload.amount;
    return this;
  }
}
