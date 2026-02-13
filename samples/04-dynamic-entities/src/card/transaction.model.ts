import { AggregateProp, BasicAggregateRoot, DomainAccess, newDatabaseId } from '@joyb-works/nestjs-futkaey';
import { ObjectId } from 'mongodb';

export class TransactionModel extends BasicAggregateRoot {
  @AggregateProp() creditcardId!: ObjectId;
  @AggregateProp() amount!: number;
  @AggregateProp() merchant!: string;

  constructor(access: DomainAccess) {
    super(access);
  }

  create(payload: { creditcardId: ObjectId; amount: number; merchant: string }) {
    this.access = DomainAccess.Create;
    this.id = newDatabaseId().toString();
    this.creditcardId = payload.creditcardId;
    this.amount = payload.amount;
    this.merchant = payload.merchant;
    return this;
  }
}
