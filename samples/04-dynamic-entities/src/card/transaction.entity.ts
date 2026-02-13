import { AuditableEntity, DynamicEntity } from '@joyb-works/nestjs-futkaey';
import { ObjectId } from 'mongodb';
import { Column, ObjectIdColumn } from 'typeorm';

@DynamicEntity({
  collectionNameGenerator: (creditcardId) => `card_${creditcardId}_transactions`,
  idField: 'creditcardId',
})
export class TransactionEntity extends AuditableEntity {
  @ObjectIdColumn({ name: '_id' })
  id!: ObjectId;

  @Column()
  creditcardId!: ObjectId;

  @Column('double', { default: 0 })
  amount!: number;

  @Column()
  merchant!: string;
}
