import { AggregateProp, BasicAggregateRoot, DomainAccess } from '@joyb-works/nestjs-futkaey';

export class LookupModel extends BasicAggregateRoot {
  @AggregateProp() name!: string;
  @AggregateProp() code!: string;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { name: string; code: string }) {
    this.access = DomainAccess.Create;
    this.id = crypto.randomUUID();
    this.name = payload.name;
    this.code = payload.code;
    return this;
  }
}
